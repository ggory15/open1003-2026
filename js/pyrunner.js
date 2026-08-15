// 브라우저에서 파이썬을 실행하는 런너 (Pyodide + Web Worker).
// - 무한 루프 보호: TIMEOUT_MS 안에 끝나지 않으면 워커를 강제 종료 후 재시작.
// - 실행 로직(마지막 표현식 repr 출력, 예외를 출력에 포함, 셀별 stdin)은
//   tools/convert_hw.py의 기대 출력 생성 하네스와 동일해야 한다.
const PyRunner = (() => {
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  const TIMEOUT_MS = 8000;

  // 워커 코드 (Blob으로 생성)
  const WORKER_SRC = `
importScripts("${PYODIDE_URL}");

const HARNESS = \`
import ast, io, sys, json, traceback, builtins

def _hw_input_factory():
    def _hw_input(prompt=""):
        if prompt:
            sys.stdout.write(str(prompt))
        line = sys.stdin.readline()
        if not line:
            raise EOFError("EOF when reading a line")
        return line[:-1] if line.endswith("\\\\n") else line
    return _hw_input

builtins.input = _hw_input_factory()

def _hw_run(cells_json, capture_index):
    cells = json.loads(cells_json)
    g = {"__name__": "__main__"}
    out = {"ok": True, "output": "", "error": None, "errorIndex": None}
    old = (sys.stdin, sys.stdout, sys.stderr)
    for i, cell in enumerate(cells):
        buf = io.StringIO()
        sys.stdin = io.StringIO(cell.get("stdin") or "")
        sys.stdout = buf
        sys.stderr = buf
        val = None
        has_val = False
        try:
            tree = ast.parse(cell["code"], mode="exec")
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                body = ast.Module(body=tree.body[:-1], type_ignores=[])
                exec(compile(body, "<hw>", "exec"), g)
                val = eval(compile(ast.Expression(tree.body[-1].value), "<hw>", "eval"), g)
                has_val = val is not None
            else:
                exec(compile(tree, "<hw>", "exec"), g)
        except BaseException:
            etype, evalue, _tb = sys.exc_info()
            err = "".join(traceback.format_exception_only(etype, evalue)).strip()
            print(err)
            if i == capture_index:
                out["ok"] = False
                out["error"] = err
                out["errorIndex"] = i
        finally:
            sys.stdin, sys.stdout, sys.stderr = old
        if i == capture_index:
            echo = ""
            if has_val:
                try:
                    echo = repr(val) + "\\\\n"
                except BaseException:
                    echo = ""
            out["output"] = buf.getvalue() + echo
    return json.dumps(out)
\`;

let pyodidePromise = loadPyodide().then((py) => {
  py.runPython(HARNESS);
  postMessage({ type: "ready" });
  return py;
});

self.onmessage = async (e) => {
  const { id, cells, captureIndex } = e.data;
  try {
    const py = await pyodidePromise;
    const fn = py.globals.get("_hw_run");
    const resultJson = fn(JSON.stringify(cells), captureIndex);
    fn.destroy();
    postMessage({ type: "result", id, result: JSON.parse(resultJson) });
  } catch (err) {
    postMessage({ type: "result", id, result: { ok: false, output: "", error: String(err), errorIndex: null } });
  }
};
`;

  let worker = null;
  let readyResolve, readyPromise;
  let nextId = 1;
  const pending = new Map();   // id -> {resolve, timer}
  let queue = Promise.resolve();
  const readyListeners = [];

  function spawn() {
    readyPromise = new Promise((res) => { readyResolve = res; });
    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        readyResolve();
        readyListeners.forEach((f) => f());
        return;
      }
      if (e.data.type === "result") {
        const p = pending.get(e.data.id);
        if (p) {
          clearTimeout(p.timer);
          pending.delete(e.data.id);
          p.resolve(e.data.result);
        }
      }
    };
  }

  function runOnce(cells, captureIndex) {
    return new Promise(async (resolve) => {
      await readyPromise;
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        worker.terminate();
        spawn(); // 다음 실행을 위해 재시작 (Pyodide 재로딩)
        resolve({ ok: false, output: "", timedout: true,
                  error: "실행 시간 초과 (8초) — 무한 루프가 아닌지 확인해보세요.", errorIndex: null });
      }, TIMEOUT_MS);
      pending.set(id, { resolve, timer });
      worker.postMessage({ id, cells, captureIndex });
    });
  }

  return {
    init() { if (!worker) spawn(); return readyPromise; },
    onReady(fn) { readyListeners.push(fn); if (worker) readyPromise.then(fn); },
    // cells: [{code, stdin}], captureIndex: 출력을 캡처할 셀 번호
    run(cells, captureIndex) {
      const job = queue.then(() => runOnce(cells, captureIndex));
      queue = job.then(() => {});
      return job;
    },
  };
})();
