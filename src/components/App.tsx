import styled, { createGlobalStyle } from "styled-components";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Bezier from "./Bezier";
import BoundingBox from "./BoundingBox";
import RichEditor from "./RichEditor";

const GlobalStyle = createGlobalStyle`
html, body {
  margin:0 ;
  padding: 0;
}
`;

const Header = styled.header`
  height: 40px;
  line-height: 40px;
  margin: 0 20px;
  padding: 0 20px;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: space-between;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 40px;
`;

const DisplayArea = styled.div`
  height: calc(100vh - 40px);
`;

const App = () => {
  return (
    <>
      <BrowserRouter>
        <GlobalStyle />
        <Header>
          <Navigation>
            <Link to="/bbox">bbox</Link>
            <Link to="/bezier">bezier</Link>
            <Link to="/richeditor">richeditor</Link>
          </Navigation>
          <a href="https://github.com/inaniwaudon/test-gui-sample">
            View the source code on GitHub
          </a>
        </Header>
        <DisplayArea>
          <Routes>
            <Route path="/bbox" element={<BoundingBox />} />
            <Route path="/bezier" element={<Bezier />} />
            <Route path="/richeditor" element={<RichEditor />} />
          </Routes>
        </DisplayArea>
      </BrowserRouter>
    </>
  );
};

export default App;
