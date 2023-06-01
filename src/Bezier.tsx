import { useEffect, useState } from "react";
import styled from "styled-components";
import opentype, { PathCommand } from "opentype.js";
import BezierEditor from "./BezierEditor";

const Tools = styled.nav`
  display: flex;
  gap: 20px;
  position: absolute;
  left: 20px;
  bottom: 20px;
`;

const Bezier = () => {
  const [commands, setCommands] = useState<PathCommand[]>();
  const [unitsPerEm, setUnitsPerEm] = useState(0);
  const [tool, setTool] = useState<"view" | "move" | "pen">("view");

  useEffect(() => {
    (async () => {
      const fontPath = "./SourceHanSansJP-Bold.otf";
      const char = "あ";
      const font = await opentype.load(fontPath);
      setUnitsPerEm(font.unitsPerEm);
      setCommands(font.getPath(char, 0, 0, font.unitsPerEm).commands);
    })();
  }, []);

  return commands ? (
    <>
      <Tools>
        <button onClick={() => setTool("view")}>閲覧</button>
        <button onClick={() => setTool("move")}>移動</button>
        <button onClick={() => setTool("pen")}>ペン</button>
      </Tools>
      <BezierEditor
        commands={commands}
        unitsPerEm={unitsPerEm}
        size={600}
        tool={tool}
        setCommands={setCommands}
      />
    </>
  ) : (
    <></>
  );
};

export default Bezier;
