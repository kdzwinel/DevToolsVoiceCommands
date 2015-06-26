export function toCSSProperty(text) {
  return text.toLowerCase().replace(' ', '-');
}

let cssUnits = {
  pixel: 'px',
  pixels: 'px',
  em: 'em',
  ems: 'em',
  percent: '%'
};

export function toCSSValue(value, unit) {
  if (unit) {
    return value + cssUnits[unit];
  }

  return value;
}

export function fromCSSValueToText(cssValue) {
  let matches = cssValue.match(/([0-9.]+)px/i);

  if (matches) {
    let numValue = matches[1];

    return (numValue === 1) ? 'one pixel' : numValue + ' pixels';
  }

  return cssValue;
}

export default {};