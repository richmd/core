import { parseMdTree } from "./parse/index";
import "./type";
import "../styles/richmd.css";

export const parseTree = (text: string) => parseMdTree(text);
