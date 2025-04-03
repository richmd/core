import nodes from "../nodes/block";
import helper from "./helper";
import "../../type";

const HEADING_REGEX = /^(#{1,})\s(.+)$/;
const ULIST_REGEX = /^(\s*)?(?:\-|\*)\s(.+)$/;
const OLIST_REGEX = /^(\s*)?([0-9]+)\.\s(.+)$/;
const HORIZONTAL_RULE_REGEX = /^[\*\-_\s]+$/;
// @ts-ignore
const CODE_REGEX = /^[`~]{3}(.*)|[`~]{3}(.*)\b[\l]+\b\:\b[\u\l]+\b$/;
const BLOCKQUOTE_REGEX = /^(>{1,})\s?(.+)$/;
const TABLE_REGEX = /(?:\s*)?\|(.+)\|(?:\s*)$/;
const KATEX_REGEX = /^[\$]{2}(.*)$/;
const COLORBLOCK_REGEX = /^[\=]{3}(.*)|[\=]{3}(.*)\b[\l]+\b$/;
const START_DETAILS_REGEX = /^\:\>(\b[\w_\.\/]+\b|[\u3040-\u309F\u30A0-\u30FF\u3400-\u9FFF])+$/;
const END_DETAILS_REGEX = /^\:\>$/;
const START_TAG_REGEX = /^\:\:\b[a-z]+\b|\:\:\b[a-z]+\b\.\b[a-z]+\b|\:\:\.\b[a-z]+\b$/;
const END_TAG_REGEX = /^\:\:$/;
const SLIDE_MODE_REGEX = /^\:use\sslide\:$/
const START_SLIDE_CENTER_REGEX = /^\:\-{3}\:(title|content)|\:\-{3}\:(title|content)\.\b[a-z]+\b$/;
const START_SLIDE_LEFT_REGEX = /^\:\<\-{2}\:(title|content)|\:\<\-{2}\:(title|content)\.\b[a-z]+\b$/;
const START_SLIDE_RIGHT_REGEX = /^\:\-{2}\>\:(title|content)|\:\-{2}\>\:(title|content)\.\b[a-z]+\b$/;
const END_SLIDE_REGEX = /^\:\-{3}\:$/;
const URL_REGEX = /^\bhttps?:\/\/(?:www\.)?[a-zA-Z0-9\-._~:/?#[@\]!$&'()*+,;=%]+\b$/;
const MODE_DEFAULT = 0;
const MODE_CODE = 1;
const MODE_KATEX = 2;
const MODE_COLORBLOCK = 3;
const MODE_SLIDE = 4;
const PAGE_MODE_DEFAULT = 0;
const PAGE_MODE_SLIDE = 1;

let tagData: Array<string>;

type Prev = {
  level: number;
  name: string;
  values: Convert[];
};

export const parser = (str: string) => {
  const ast: object[] & Convert[] = [];

  let stack = "";
  let mode = MODE_DEFAULT;
  let pageMode = PAGE_MODE_DEFAULT;
  let tables: string[] = [];
  let match: RegExpMatchArray | null;
  let codeLang = "";
  let filename = "";
  let messageType = "default";
  let prevListValue = "";

  const parseStack = (stack: string) => {
    if (tables.length > 0) {
      ast.push(new nodes.Table(tables));
      tables = [];
    }

    if (!helper.isEmpty(stack)) {
      ast.push(new nodes.Paragraph(stack));
    }
  };

  // \r を削除 & \n で分割し、配列化
  const lines = str.replace(/\r/g, "").split("\n");

  for (let line of lines) {
    if (ast.length === 0 && pageMode === PAGE_MODE_DEFAULT) {
      if (SLIDE_MODE_REGEX.test(line)) {
        ast.push(new nodes.Mode("slide"));
        pageMode = PAGE_MODE_SLIDE;
        mode = MODE_SLIDE;
      } else {
        ast.push(new nodes.Mode("default"));
      }
    }
    
    if (pageMode === PAGE_MODE_SLIDE && mode === MODE_SLIDE && START_SLIDE_CENTER_REGEX.test(line)) {
      const slideData = line.replace(/\:\-{3}:/, "").trim().split(".");
      ast.push(new nodes.StartSlide("center", slideData[0], slideData[1] ?? "default"));
      mode = MODE_DEFAULT;
      stack = "";
    } else if (pageMode === PAGE_MODE_SLIDE && mode === MODE_SLIDE && START_SLIDE_LEFT_REGEX.test(line)) {
      const slideData = line.replace(/\:\<\-{2}:/, "").trim().split(".");
      ast.push(new nodes.StartSlide("left", slideData[0], slideData[1] ?? "default"));
      mode = MODE_DEFAULT;
      stack = "";
    } else if (pageMode === PAGE_MODE_SLIDE && mode === MODE_SLIDE && START_SLIDE_RIGHT_REGEX.test(line)) {
      const slideData = line.replace(/\:\-{2}\>:/, "").trim().split(".");
      ast.push(new nodes.StartSlide("right", slideData[0], slideData[1] ?? "default"));
      mode = MODE_DEFAULT;
      stack = "";
    } else if (pageMode === PAGE_MODE_SLIDE && mode === MODE_DEFAULT && END_SLIDE_REGEX.test(line)) {
      parseStack(stack);
      ast.push(new nodes.EndSlide());
      mode = MODE_SLIDE;
      stack = "";
    } else if (mode === MODE_DEFAULT && START_DETAILS_REGEX.test(line)) {
      parseStack(stack);
      const summaryData = line.replace(/\:\>/, "").trim();
      ast.push(new nodes.StartDetails(summaryData));
      stack = "";
    } else if (mode === MODE_DEFAULT && END_DETAILS_REGEX.test(line)) {
      parseStack(stack);
      ast.push(new nodes.EndDetails());
      stack = "";
    } else if (mode === MODE_DEFAULT && START_TAG_REGEX.test(line)) {
      parseStack(stack);
      const lineData = line.replace(/\:\:/, "").trim();
      if (lineData) {
        tagData = lineData.split(".");
      } else {
        tagData = ["span", ""];
      }
      ast.push(new nodes.StartTag(tagData[0] ?? "span", tagData[1]));
      stack = "";
    } else if (mode === MODE_DEFAULT && END_TAG_REGEX.test(line)) {
      parseStack(stack);
      ast.push(new nodes.EndTag(tagData ? tagData[0] : "span"));
      stack = "";
    } else if (CODE_REGEX.test(line)) {
      if (mode === MODE_CODE) {
        ast.push(new nodes.Code(stack.trim(), codeLang, filename));
        codeLang = "";
        filename = "";
        mode = MODE_DEFAULT;
        stack = "";
      } else if (mode === MODE_DEFAULT) {
        parseStack(stack);
        const codeData = line
          .replace(/\`\`\`/, "")
          .trim()
          .split(`\:`);
        codeLang = codeData[0];
        filename = codeData[1];
        mode = MODE_CODE;
        stack = "";
      } else {
        stack += line !== "" ? `${line}\n` : "\n";
      }
    } else if (KATEX_REGEX.test(line)) {
      if (mode === MODE_KATEX) {
        ast.push(new nodes.Katex(stack.trim()));
        mode = MODE_DEFAULT;
        stack = "";
      } else if (mode === MODE_DEFAULT) {
        parseStack(stack);
        mode = MODE_KATEX;
        stack = "";
      } else {
        stack += line !== "" ? `${line}\n` : "\n";
      }
    } else if (COLORBLOCK_REGEX.test(line)) {
      if (mode === MODE_COLORBLOCK) {
        ast.push(new nodes.ColorBlock(stack.trim(), messageType));
        messageType = "default";
        mode = MODE_DEFAULT;
        stack = "";
      } else if (mode === MODE_DEFAULT) {
        parseStack(stack);
        messageType = line.replace(/\=\=\=/, "").trim();
        if (messageType === "") {
          messageType = "default";
        }
        mode = MODE_COLORBLOCK;
        stack = "";
      } else {
        stack += line !== "" ? `${line}\n` : "\n";
      }
    } else if (mode === MODE_DEFAULT && line.match(BLOCKQUOTE_REGEX) !== null) {
      match = line.match(BLOCKQUOTE_REGEX);
      if (match === null) continue;
      parseStack(stack);
      ast.push(new nodes.Blockquote(match[2], match[1].length));
      stack = "";
    } else if (
      mode === MODE_DEFAULT &&
      HORIZONTAL_RULE_REGEX.test(line) &&
      line.split(/[\*\-_]/).length > 3
    ) {
      parseStack(stack);
      stack = "";
      ast.push(new nodes.Horizontal());
    } else if (mode === MODE_DEFAULT && line.match(HEADING_REGEX) !== null) {
      match = line.match(HEADING_REGEX);
      if (match === null) continue;
      parseStack(stack);
      stack = "";
      ast.push(new nodes.Heading(match[2], match[1].length));
    } else if (mode === MODE_DEFAULT && line.match(ULIST_REGEX) !== null) {
      match = line.match(ULIST_REGEX);
      if (match === null) continue;
      parseStack(stack);
      const prev: Prev = ast[ast.length - 1];
      const check = match[2].match(/^\[(x|\u0020)?\]\s(.+)$/);
      let level = 1;
      if (prev && (prev.name === "list" || prev.name === "checklist")) {
        const indent = (match[1] || "").length;
        if (indent % 2 === 0) {
          if (prev.level * 2 <= indent) {
            level = prev.level + 1;
          } else if ((prev.level - 1) * 2 === indent) {
            level = prev.level;
          } else if (indent === 0) {
            level = 1;
          } else if (prev.level * 2 > indent) {
            level = prev.level - 1;
          }
        } else {
          continue;
        }
      }
      let value = match[2].trim();
      if (URL_REGEX.test(value)) {
        value = `[${value}](${value})`;
      }

      let checkValue = "";
      if (check && URL_REGEX.test(check[2].trim())) {
        checkValue = `[${check[2].trim()}](${check[2].trim()})`;
      }
      prevListValue = value;
      const list = check
        ? new nodes.CheckList(checkValue, check[1] === "x", level)
        : new nodes.List(value, level);
      ast.push(list);
      stack = "";
    } else if (mode === MODE_DEFAULT && line.match(OLIST_REGEX) !== null) {
      match = line.match(OLIST_REGEX);
      if (match === null) continue;
      parseStack(stack);
      const prev: Prev = ast[ast.length - 1];
      let level = 1;
      const order: number = match[2] as unknown as number;
      if (prev && prev.name === "orderedlist") {
        const indent = (match[1] || "").length;
        if (indent % 2 === 0) {
          if (prev.level * 2 <= indent) {
            level = prev.level + 1;
          } else if ((prev.level - 1) * 2 === indent) {
            level = prev.level;
          } else if (indent === 0) {
            level = 1;
          } else if (prev.level * 2 > indent) {
            level = prev.level - 1;
          }
        } else {
          continue;
        }
      }

      let value = match[3].trim();
      if (URL_REGEX.test(value)) {
        value = `[${value}](${value})`;
      }
      prevListValue = value;
      const list = new nodes.OrderedList(value, order || 0, level);
      ast.push(list);
      stack = "";
    } else if (mode === MODE_DEFAULT && line.match(TABLE_REGEX) !== null) {
      match = line.match(TABLE_REGEX);
      if (match === null) continue;
      tables.push(line);
      stack = "";
    } else if (line === "") {
      if (mode === MODE_DEFAULT) {
        parseStack(stack);
        ast.push(new nodes.Br());
        stack = "";
      }
      if (mode === MODE_CODE) {
        stack += line !== "" ? `${line}\n` : "\n";
      }
    } else {
      const prev: Prev = ast[ast.length - 1];
      if (
        prev &&
        (prev.name === "list" || prev.name === "checklist" || prev.name === "orderedlist")
      ) {
        const latestAst = ast[ast.length - 1];
        const { values } = latestAst;
        ast.pop();
        if (prev.name === "checklist") {
          ast.push(new nodes.CheckList(
            `${prevListValue}\n${line}`,
            latestAst.values[values.length - 1].checked,
            latestAst.level,
          ));
        } else if (prev.name === "orderedlist") {
          ast.push(new nodes.OrderedList(
            `${prevListValue}\n${line}`,
            latestAst.values[values.length - 1].order,
            latestAst.level,
          ));
        } else {
          ast.push(new nodes.List(
            `${prevListValue}\n${line}`,
            latestAst.level,
          ));
        }
        stack = "";
      } else {
        if (mode !== MODE_SLIDE) {
          if (URL_REGEX.test(line)) {
            line = `[${line}](${line})`;
          }
          stack += line !== "" ? `${line}\n` : "\n";
        }
      }
    }
  }
  return ast;
};
