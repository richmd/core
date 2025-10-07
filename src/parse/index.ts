import { parser } from "./parser";
import Tree from "./Tree";

export const parseMdTree = (mdString: string, useSlide: boolean = true) => {
  const ast = parser(mdString, useSlide);

  return new Tree(ast);
};
