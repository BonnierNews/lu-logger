import * as path from "path";

export function getLoc(depth) {
  try {
    let stack, file, frame;

    const pst = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, innerStack) => {
      Error.prepareStackTrace = pst;
      return innerStack;
    };

    stack = new Error().stack;
    if (!depth /* c8 ignore next */ || isNaN(depth)) {
      depth = 1;
      /* c8 ignore next 3 */
    } else {
      depth = depth > stack.length - 2 ? stack.length - 2 : depth;
    }
    stack = stack.slice(depth + 1);

    do {
      frame = stack.shift();
      file = frame && frame.getFileName();
    } while ((stack.length && file === "module.js") || file.includes("node_modules"));

    let calleePath;
    if (process.cwd()) {
      calleePath = path.relative(process.cwd(), frame.getFileName());
      /* c8 ignore next 3 */
    } else {
      calleePath = frame.getFileName();
    }

    return `${calleePath}:${frame.getLineNumber()}`;
    /* c8 ignore next 3 */
  } catch (e) {
    return undefined;
  }
}

export default { getLoc };
