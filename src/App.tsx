import React from "react";
import BoundingBox from "./BoundingBox";
import styled, { createGlobalStyle } from "styled-components";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

const GlobalStyle = createGlobalStyle`
html, body {
  margin:0 ;
  padding: 0;
}
`;

const Navigation = styled.nav`
  height: 40px;
  line-height: 40px;
  margin: 0 20px;
  padding: 0 20px;
  border-bottom: solid 1px #ccc;
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
        <Navigation>
          <Link to="/bbox">bbox</Link>
          <Link to="/bezier">bezier</Link>
        </Navigation>
        <DisplayArea>
          <Routes>
            <Route path="/bbox" element={<BoundingBox />} />
          </Routes>
        </DisplayArea>
      </BrowserRouter>
    </>
  );
};

export default App;
