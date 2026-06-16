/* eslint-disable react/display-name */
// Lightweight framer-motion stub for Jest: renders motion.* as plain elements
// (stripping animation-only props) and AnimatePresence as a passthrough.
import React from 'react';

const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'layout', 'layoutId', 'drag', 'dragConstraints', 'viewport', 'custom',
]);

const stripMotionProps = (props) => {
  const out = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_PROPS.has(key)) out[key] = props[key];
  }
  return out;
};

const makeComponent = (tag) =>
  React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(tag, { ...stripMotionProps(props), ref }, children)
  );

export const motion = new Proxy(
  {},
  {
    get: (_target, key) => makeComponent(typeof key === 'string' ? key : 'div'),
  }
);

export const AnimatePresence = ({ children }) => children;
export const useReducedMotion = () => false;
