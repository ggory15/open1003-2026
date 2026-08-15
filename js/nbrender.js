// .ipynb(JSON)를 브라우저에서 HTML로 렌더링합니다.
// 학생이 올린 파일은 신뢰할 수 없으므로 마크다운은 DOMPurify로 정화하고,
// 출력은 텍스트/이미지만 표시합니다(text/html 출력은 렌더링하지 않음).

function nbSource(cell) {
  const s = cell.source;
  return Array.isArray(s) ? s.join("") : (s || "");
}

function stripAnsi(text) {
  return String(text).replace(/\[[0-9;]*m/g, "");
}

function nbRenderOutputs(outputs) {
  if (!outputs || !outputs.length) return "";
  const parts = [];
  for (const out of outputs) {
    if (out.output_type === "stream") {
      const text = Array.isArray(out.text) ? out.text.join("") : (out.text || "");
      parts.push(`<pre class="nb-output">${esc(stripAnsi(text))}</pre>`);
    } else if (out.output_type === "execute_result" || out.output_type === "display_data") {
      const data = out.data || {};
      if (data["image/png"]) {
        const b64 = Array.isArray(data["image/png"]) ? data["image/png"].join("") : data["image/png"];
        parts.push(`<div class="nb-output"><img alt="output image" src="data:image/png;base64,${b64.replace(/\s/g, "")}"></div>`);
      } else if (data["text/plain"]) {
        const text = Array.isArray(data["text/plain"]) ? data["text/plain"].join("") : data["text/plain"];
        parts.push(`<pre class="nb-output nb-result">${esc(stripAnsi(text))}</pre>`);
      }
    } else if (out.output_type === "error") {
      const tb = (out.traceback || []).map(stripAnsi).join("\n");
      parts.push(`<pre class="nb-output nb-error">${esc(tb || `${out.ename}: ${out.evalue}`)}</pre>`);
    }
  }
  return parts.join("");
}

function renderNotebook(nb, container) {
  container.innerHTML = "";
  if (!nb || !Array.isArray(nb.cells)) {
    container.innerHTML = `<p class="muted">노트북 형식을 읽을 수 없습니다.</p>`;
    return;
  }
  for (const cell of nb.cells) {
    const div = document.createElement("div");
    const src = nbSource(cell);

    if (cell.cell_type === "markdown") {
      div.className = "nb-cell nb-md";
      div.innerHTML = DOMPurify.sanitize(marked.parse(src));
    } else if (cell.cell_type === "code") {
      div.className = "nb-cell nb-code";
      let highlighted;
      try {
        highlighted = hljs.highlight(src, { language: "python" }).value;
      } catch {
        highlighted = esc(src);
      }
      const count = cell.execution_count != null ? cell.execution_count : " ";
      div.innerHTML = `
        <div class="nb-code-row">
          <span class="nb-prompt">[${count}]</span>
          <pre class="nb-input"><code class="hljs language-python">${highlighted}</code></pre>
        </div>
        ${nbRenderOutputs(cell.outputs)}`;
      if (!src.trim()) div.classList.add("nb-empty");
    } else {
      continue;
    }
    container.appendChild(div);
  }
}
