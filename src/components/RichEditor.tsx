import { useRef, useState } from "react";
import styled from "styled-components";
import DrawTextSvg from "./Text/DrawTextSvg";
import { Point, Range } from "@/lib/figure";
import { useKey } from "@/lib/useKey";
import { useWindowSize } from "@/lib/useWindowSize";
import {
  backTextIndex,
  getHeadTextIndex,
  getTailTextIndex,
  getTextSelection,
  isAllSelection,
  isCollapsedSelection,
  moveSelection,
  sortSelection,
  TextIndex,
} from "@/lib/text/selection";
import {
  addCharsToText,
  breakLineText,
  createDefaultText,
  deleteCharsFromText,
  getCharLeft,
  setBold,
  setKerning,
  TextObj,
} from "@/lib/text/text";
import { calculateItemRects, calculateLineRects } from "@/lib/text/typeset";

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
  const windowSize = useWindowSize();
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const updateSelection = (
    newSelection?: Range<TextIndex>,
    newText?: TextObj
  ) => {
    setSelection(newSelection);
    if (!newSelection) {
      return;
    }

    // update the input position
    const sortedSelection = sortSelection(newSelection);
    const linePosition = calculateLineRects(newText ?? text);
    const line = (newText ?? text).lines[sortedSelection.from.line];
    const itemRects = calculateItemRects(line);
    const x =
      text.position.x + getCharLeft(sortedSelection.from.item, itemRects);
    const y = linePosition[sortedSelection.from.line].y + text.position.y;
    setInputPoint({ x, y });
  };

  const selectAll = () => {
    updateSelection({
      from: getHeadTextIndex(),
      to: getTailTextIndex(text),
    });
  };

  const refocus = (newText?: TextObj, newSelection?: Range<TextIndex>) => {
    setInputValue("");
    setInputInitialText(newText ?? text);
    setInputInitialSelection(newSelection ?? selection);
  };

  const onFocus = () => {
    refocus();
  };

  const addChars = (value: string) => {
    if (!inputInitialSelection || !inputInitialText) {
      return;
    }
    const newText = structuredClone(inputInitialText);
    const newSelection = addCharsToText(newText, value, inputInitialSelection);
    setSelection(newSelection);
    setText(newText);
    return { text: newText, selection: newSelection };
  };

  const deleteChars = () => {
    if (selection) {
      const newText = structuredClone(text);
      const deletedSelection = sortSelection(structuredClone(selection));
      if (isCollapsedSelection(selection)) {
        deletedSelection.from = backTextIndex(deletedSelection.from, text);
      }
      const newSelection = deleteCharsFromText(newText, deletedSelection);
      updateSelection(newSelection, newText);
      setText(newText);
      refocus(newText, newSelection);
    }
  };

  const breakLine = () => {
    if (selection) {
      const newText = structuredClone(text);
      const newSelection = breakLineText(newText, selection.from);
      updateSelection(newSelection, newText);
      setText(newText);
      refocus(newText, newSelection);
    }
  };

  const updateKerning = (delta: number) => {
    if (selection) {
      const newText = structuredClone(text);
      setKerning(newText, delta, selection);
      setText(newText);
    }
  };

  const updateBold = () => {
    if (selection) {
      const newText = structuredClone(text);
      setBold(newText, selection);
      setText(newText);
    }
  };

  // mouse event
  const onMouseDown = (e: React.MouseEvent) => {
    if (!wrapperRef.current) {
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const mousePoint: Point = {
      x: e.clientX - rect.x,
      y: e.clientY - rect.y,
    };

    // clear all selection
    if (
      (selection && isAllSelection(selection, text)) ||
      mouseDownTime === undefined ||
      Date.now() - mouseDownTime > 500
    ) {
      updateSelection(
        getTextSelection(text, { from: mousePoint, to: mousePoint })
      );
    }
    // double click
    else {
      selectAll();
    }

    setMouseDownPoint(mousePoint);
    setMouseDownTime(Date.now());
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current) {
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const mousePoint: Point = {
      x: e.clientX - rect.x,
      y: e.clientY - rect.y,
    };

    // select characters
    if (mouseDownPoint) {
      const newSelection = getTextSelection(text, {
        from: mouseDownPoint,
        to: mousePoint,
      });
      updateSelection(newSelection);
    }
  };

  const onMouseUp = () => {
    setMouseDownPoint(undefined);
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
    if (inputValue.length === 0 && selection) {
      deleteChars();
    }
  });

  useKey("ArrowUp", (e) => {
    if (inputValue.length > 0 || !selection) {
      return;
    }
    const newSelection = moveSelection(selection, "top", e.shiftKey, text);
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowDown", (e) => {
    if (inputValue.length > 0 || !selection) {
      return;
    }
    const newSelection = moveSelection(selection, "bottom", e.shiftKey, text);
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowLeft", (e) => {
    if (inputValue.length > 0 || !selection) {
      return;
    }
    if (e.altKey) {
      updateKerning(-50);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(selection, "left", e.shiftKey, text);
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("ArrowRight", (e) => {
    if (inputValue.length > 0 || !selection || !text) {
      return;
    }
    if (e.altKey) {
      updateKerning(50);
      e.preventDefault();
      return;
    }
    const newSelection = moveSelection(selection, "right", e.shiftKey, text);
    updateSelection(newSelection);
    refocus(undefined, newSelection);
  });

  useKey("Enter", (e) => {
    if (selection && !e.isComposing) {
      breakLine();
    }
  });

  useKey("b", (e) => {
    if (e.ctrlKey || e.metaKey) {
      updateBold();
    }
  });

  return (
    <>
      <Wrapper
        ref={wrapperRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <InputWrapper position={inputPoint}>
          <Input
            value={inputValue}
            ref={inputRef}
            onFocus={onFocus}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyUp={onKeyUp}
            onCompositionEnd={onCompositionEnd}
          />
        </InputWrapper>
        <DrawTextSvg text={text} size={windowSize} selection={selection} />
      </Wrapper>
    </>
  );
};

export default RichEditor;
