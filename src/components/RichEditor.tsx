import { useRef, useState } from "react";
import styled from "styled-components";
import DrawTextSvg from "./DrawTextSvg";
import { Point, Range } from "../lib/figure";
import { useKey } from "../lib/useKey";
import { useWindowSize } from "../lib/useWindowSize";
import { TextObj, createDefaultText, getCharLeft } from "../lib/text";
import {
  TextIndex,
  getHeadTextIndex,
  getTailTextIndex,
  sortSelection,
} from "../lib/selection";

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

const InputWrapper = styled.div<{
  position: Point;
}>`
  position: absolute;
  top: ${({ position }) => position.y}px;
  left: ${({ position }) => position.x}px;
`;

const Input = styled.input`
  pointer-events: none;
  z-index: 1;
  opacity: 0;

  &:focus {
    outline: unset;
  }
`;

const RichEditor = () => {
  const origin: Point = { x: 40, y: 30 };
  const windowSize = useWindowSize();

  const [text, setText] = useState<TextObj>(createDefaultText());

  // input
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputPoint, setInputPoint] = useState<Point>({ x: 0, y: 0 });
  const [inputInitialText, setInputInitialText] = useState<TextObj>();
  const [inputInitialSelection, setInputInitialSelection] =
    useState<Range<TextIndex>>();

  const [selection, setSelection] = useState<Range<TextIndex>>();
  const [mouseDownPoint, setMouseDownPoint] = useState<Point>();
  const [mouseDownTime, setMouseDownTime] = useState<number>();
  const [action, setAction] = useState<"move" | "edit">();
  const [initialText, setInitialText] = useState<TextObj>();

  // 文字の選択
  /*const updateSelection = (
    newSelection?: Range<TextIndex>,
    newText?: TextObj
  ) => {
    setSelection(newSelection);
    if (!newSelection) {
      return;
    }

    // input の位置を更新
    const sortedSelection = sortSelection(newSelection);
    const linePosition = calculateLineRects(text);
    const line = text.lines[sortedSelection.from.line];
    const itemRects = calculateItemRects(line);
    const x =
      text.position.x + getCharLeft(sortedSelection.from.item, itemRects);
    const y = linePosition[sortedSelection.from.line].y + text.position.y;
    setInputPoint({ x, y });
  };*/

  /*const selectAll = () => {
    updateSelection({
      from: getHeadTextIndex(),
      to: getTailTextIndex(text),
    });
  };

  const refocus = (newText?: TextObj, newSelection?: Range<TextIndex>) => {
    setInputValue("");
    setInputInitialText(newText ?? text);
    setInputInitialSelection(newSelection ?? selection);
  };*/

  /*const onFocus = () => {
    refocus();
  };

  const addChars = (value: string) => {
    if (!inputInitialSelection || !inputInitialText) {
      return;
    }
    const newText = structuredClone(inputInitialText);
    const newSelection = addCharsToText(newText, value, inputInitialSelection);
    setSelectedText(newText);
    setSelection(newSelection);
    return { text: newText, selection: newSelection };
  };

  const deleteChars = () => {
    if (!selection) {
      return;
    }
    const newText = structuredClone(text);
    const deletedSelection = sortSelection(structuredClone(selection));
    if (isCollapsedSelection(selection)) {
      deletedSelection.from = backTextIndex(
        deletedSelection.from,
        selectedText
      );
    }
    const newSelection = deleteCharsFromText(newText, deletedSelection);
    setSelectedText(newText);
    updateSelection(newSelection, newText);
    refocus(newText, newSelection);
  };

  const breakLine = () => {
    if (!selection) {
      return;
    }
    const newText = structuredClone(text);
    const newSelection = breakLineText(newText, selection.from);
    setSelectedText(newText);
    updateSelection(newSelection, newText);
    refocus(newText, newSelection);
  };

  const updateKerning = (delta: number) => {
    if (!selection) {
      return;
    }
    const newText = structuredClone(text);
    setKerning(newText, delta, selection);
    setSelectedText(newText);
  };

  // マウスイベント
  const onMouseDown = (e: React.MouseEvent) => {
    const mousePoint: Point = {
      x: e.clientX - origin.x,
      y: e.clientY - origin.y,
    };

    // テキストを選択
    let selected = false;
    let edits = false;
    for (const { box, id } of boundingBoxToId) {
      if (rectContainsPoint(box, mousePoint)) {
        setSelectedObjId(id);
        edits =
          (selectedObjId === id && action === "edit") ||
          (action === "move" &&
            mouseDownTime !== undefined &&
            Date.now() - mouseDownTime < 500);
        setAction(edits ? "edit" : "move");
        selected = true;
        break;
      }
    }
    if (!selected) {
      setSelectedObjId(undefined);
      setAction(undefined);
    }
    if (!edits) {
      setSelection(undefined);
    }
    setInitialText(undefined);

    if (selectedText && (edits || action === "edit")) {
      // 既に全選択であれば解除
      if (
        (selection && isAllSelection(selection, selectedText)) ||
        mouseDownTime === undefined ||
        Date.now() - mouseDownTime > 500
      ) {
        updateSelection(
          getTextSelection(selectedText, { from: mousePoint, to: mousePoint })
        );
      }
      // ダブルクリック時にすべて選択
      else {
        selectAll();
      }
    }

    setMouseDownPoint(mousePoint);
    setMouseDownTime(Date.now());
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!selectedText) {
      return;
    }
    const mousePoint: Point = {
      x: e.clientX - origin.x,
      y: e.clientY - origin.y,
    };

    // 移動
    if (action === "move") {
      if (!initialText) {
        setInitialText(selectedText);
      } else if (mouseDownPoint && initialText) {
        const diffX = mousePoint.x - mouseDownPoint.x;
        const diffY = mousePoint.y - mouseDownPoint.y;
        const newText = structuredClone(selectedText);
        newText.position = {
          x: initialText.position.x + diffX,
          y: initialText.position.y + diffY,
        };
        setSelectedText(newText);
      }
      return;
    }

    // 文字の選択
    if (action === "edit" && mouseDownPoint) {
      const newSelection = getTextSelection(selectedText, {
        from: mouseDownPoint,
        to: mousePoint,
      });
      updateSelection(newSelection);
    }
  };

  const onMouseUp = () => {
    setMouseDownPoint(undefined);
    setInitialText(undefined);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // input
  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.currentTarget.value.length > 0) {
      const result = addChars(e.currentTarget.value);
      // IME が未確定の場合は反映しない
      if (result && !e.nativeEvent.isComposing) {
        refocus(result.text, result.selection);
      }
    }
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    if (e.currentTarget.value.length > 0) {
      const result = addChars(e.currentTarget.value);
      if (result) {
        refocus(result.text, result.selection);
      }
    }
  };

  // keyboard
  useKey("Backspace", () => {
    if (inputtingOthers) {
      return;
    }
    if (!selection && selectedObjId) {
      // オブジェクトの削除
      deleteObject(selectedObjId);
    }
    if (inputValue.length === 0 && selection) {
      deleteChars();
    }
  });

  useKey("ArrowUp", (e) => {
    if (
      inputtingOthers ||
      inputValue.length > 0 ||
      !selection ||
      !selectedText
    ) {
      return;
    }
    const isVertical = selectedText.writingMode === "vertical";
    if (e.altKey && isVertical) {
      updateKerning(-10);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(
      selection,
      isVertical ? "left" : "top",
      e.shiftKey,
      selectedText
    );
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowDown", (e) => {
    if (
      inputtingOthers ||
      inputValue.length > 0 ||
      !selection ||
      !selectedText
    ) {
      return;
    }
    const isVertical = selectedText.writingMode === "vertical";
    if (e.altKey && isVertical) {
      updateKerning(10);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(
      selection,
      isVertical ? "right" : "bottom",
      e.shiftKey,
      selectedText
    );
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowLeft", (e) => {
    if (
      inputtingOthers ||
      inputValue.length > 0 ||
      !selection ||
      !selectedText
    ) {
      return;
    }
    const isVertical = selectedText.writingMode === "vertical";
    if (e.altKey && !isVertical) {
      updateKerning(-10);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(
      selection,
      isVertical ? "bottom" : "left",
      e.shiftKey,
      selectedText
    );
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowRight", (e) => {
    if (
      inputtingOthers ||
      inputValue.length > 0 ||
      !selection ||
      !selectedText
    ) {
      return;
    }
    const isVertical = selectedText.writingMode === "vertical";
    if (e.altKey && !isVertical) {
      updateKerning(10);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(
      selection,
      isVertical ? "top" : "right",
      e.shiftKey,
      selectedText
    );
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("Enter", (e) => {
    if (!inputtingOthers && selection && !e.isComposing) {
      breakLine();
    }
  });

  useKey("Tab", (e) => {
    if (!inputtingOthers && selection && !e.isComposing) {
      const result = addChars("\t");
    }
  });*/

  return (
    <>
      <Wrapper
      //onMouseDown={onMouseDown}
      //onMouseMove={onMouseMove}
      //onMouseUp={onMouseUp}
      >
        <InputWrapper position={inputPoint}>
          <Input
            value={inputValue}
            ref={inputRef}
            //onFocus={onFocus}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            //onKeyUp={onKeyUp}
            //onCompositionEnd={onCompositionEnd}
          />
        </InputWrapper>
        <DrawTextSvg
          text={text}
          origin={origin}
          size={windowSize}
          selection={selection}
        />
      </Wrapper>
    </>
  );
};

export default RichEditor;
