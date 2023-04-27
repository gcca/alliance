import * as ts from "typescript";

const fileName = "./tests/components.ts";

//const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
//const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
//const program = ts.createProgram(config.fileNames, config.options);
//
const program = ts.createProgram([fileName], {
  target: 2,
  module: 1,
  esModuleInterop: true,
  sourceMap: true,
  strict: true,
  experimentalDecorators: true,
  configFilePath: undefined,
});

const sourceFile = program.getSourceFile(fileName);

//class MyVisitor implements ts.Visitor {
//visitVariableDeclaration(node: ts.VariableDeclaration) {
//return node;
//}

//visitFunctionDeclaration(node: ts.FunctionDeclaration) {
//return node;
//}
//}

if (!sourceFile) {
  throw new Error("No sourceFile");
}

const visitor = (node: ts.Node): ts.Node => {
  console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
  return ts.visitNode(node, visitor);
};

const transformedSourceFile = ts.visitNode(sourceFile.statements[0], visitor);

//console.log(transformedSourceFile);

//const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
//console.log(printer.printFile(transformedSourceFile));
