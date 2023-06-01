type Metrics = {
  [key in string]: {
    width: number;
  };
};

export const metrics: Metrics = {};

const calculateCharWidth = (char: string) => {
  if (typeof document === "undefined") {
    return 0;
  }
  const svgText = document.getElementById("text-measurement");
  if (!svgText) {
    return 0;
  }
  svgText.style.fontSize = "100";
  svgText.style.fontFamily = "FOT-筑紫明朝 Pr6 B";
  svgText.innerHTML = char;
  const bounding = svgText.getBoundingClientRect();
  return bounding.width / 100;
};

export const getCharWidth = (char: string) => {
  if (!(char in metrics)) {
    metrics[char] = {
      width: calculateCharWidth(char),
    };
  }
  return metrics[char].width;
};
