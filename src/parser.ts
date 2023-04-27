#!/usr/bin/env node

import path from "path";

import ts from "typescript";
import fs from "fs";

interface ParserArguments {
  srcDir: string;
}

function _FilterParserArgs(args: string[]): string[] {
  for (let i = 0; i < args.length; i++) {
    if (args[i].endsWith("parser.ts")) {
      return args.slice(i + 1);
    }
  }
  throw new Error("Bad command line arguments");
}

function ParseArguments(args: string[]): ParserArguments {
  let parserArgs = _FilterParserArgs(args);
  return { srcDir: parserArgs[0] };
}

interface PipRecord {
  pip: string;
  class: string;
  file: string;
}

interface Config {
  pips: PipRecord[];
  components: { class: string; file: string }[];
}

function ReadConfig(srcDir: string): Config {
  let fullPath = path.join(srcDir, 'config.json');
  return require(fullPath);
}

interface ClassRecordArgument {
  name: string;
  typeName: string;
}

interface ClassRecord {
  arguments: ClassRecordArgument[];
}

interface ClassRecords {
  [key: string]: ClassRecord;
}

function ReadComponentRecords(
  srcDir: string,
  componentPath: string
): ClassRecords {
  let filePath = path.join(srcDir, componentPath);
  let rootNode = ReadComponentFile(filePath);

  let classes: ClassRecords = {};

  rootNode.forEachChild((node: ts.Node) => {
    if (ts.isClassDeclaration(node)) {
      let classDeclaration: ts.ClassDeclaration = node;

      if (classDeclaration.name == null || classDeclaration == undefined) {
        throw new Error("Empty class declaration name");
      }

      let classIdentifier: ts.Identifier = classDeclaration.name;
      let classKey = classIdentifier.escapedText as string;
      let classMembers = classDeclaration.members;
      let firstMember = classMembers[0];

      if (!ts.isConstructorDeclaration(firstMember)) {
        throw new Error("First class member must be the constructor");
      }

      let constructorDeclaration: ts.ConstructorDeclaration = firstMember;

      try {
        classes[classKey] = {
          arguments: constructorDeclaration.parameters.map(ExtractRecords),
        };
      } catch (error) {
        throw new Error(`Error en la clase ${classKey}: ${error}`);
      }
    }
  });

  return classes;
}

function ExtractRecords(
  parameter: ts.ParameterDeclaration
): ClassRecordArgument {
  let nameIdentifier = parameter.name as ts.Identifier;
  let parameterName = nameIdentifier.escapedText as string;

  if (parameter.type === null || parameter.type === undefined) {
    throw new Error(`Not defined type in constructor for ${parameterName}`);
  }

  let typeReference = parameter.type as ts.TypeReferenceNode;
  let typeNameIdentifier = typeReference.typeName as ts.Identifier;
  let parameterTypeName = typeNameIdentifier.escapedText as string;

  return { name: parameterName, typeName: parameterTypeName };
}

interface PipMap {
  [key: string]: PipRecord;
}

function GenerateContainerFile(
  baseDir: string,
  srcDir: string,
  config: Config
): void {
  let pips: PipMap = config.pips.reduce(
    (pipMap: { [_: string]: PipRecord }, record: PipRecord) => {
      return { ...pipMap, [record.pip]: record };
    },
    {}
  );

  let head: string[] = [];
  let lines: string[] = ["export default class Container {"];

  for (let component of config.components) {
    let componentRecords = ReadComponentRecords(srcDir, component.file);

    let className = component.class;
    lines.push(
      `\nProduce${className}(): ${className} { return new ${className}(`
    );
    PushArguments(lines, head, className, componentRecords, pips);
    lines.push(`); }`);

    let modulePath = component.file.slice(0, -3);
    head.push(`import { ${className} } from "${modulePath}";`);
  }

  lines.push("\n}");

  head.push("\n");
  let data = head.join("\n") + lines.join("");

  let containerFilePath = path.join(srcDir, "container.ts");
  fs.writeFileSync(containerFilePath, data);
}

function PushArguments(
  lines: string[],
  head: string[],
  className: string,
  componentRecords: ClassRecords,
  pips: PipMap
): void {
  let classArguments = componentRecords[className].arguments;

  let stringArguments = classArguments.map((record: ClassRecordArgument) => {
    let pip: PipRecord = pips[record.typeName];

    let modulePath = pip.file.slice(0, -3);
    head.push(`import { ${pip.class} } from "${modulePath}";`);

    return `new ${pip.class}()`;
  });

  lines.push(stringArguments.join(', '));
}


function Main(args: string[]) {
  let parsedArguments = ParseArguments(args);
  let baseDir = process.cwd();
  let srcDir = path.join(baseDir, parsedArguments.srcDir);

  GenerateConfig(srcDir);

  let config = ReadConfig(srcDir);
  GenerateContainerFile(baseDir, srcDir, config);
}

function GenerateConfig(srcDir: string) {
  return // GENERAR EL CONFIG DESDE EL ANALISIS DE LOS ARCHIVOS
}

Main(process.argv);

function ReadComponentFile(fileName: string): ts.Node {
  return ts.createSourceFile(
    "__hidden_module__.ts",
    fs.readFileSync(fileName, "utf8"),
    ts.ScriptTarget.Latest
  );
}

function ParseImports(node: ts.Node): { [key: string]: string[] } {
  let modules: { [key: string]: string[] } = {};
  node.forEachChild((child: ts.Node) => {
    if (child.kind === ts.SyntaxKind.ImportDeclaration) {
      let importDeclaration = <ts.ImportDeclaration>child;
      let modulePath = (<ts.StringLiteral>importDeclaration.moduleSpecifier)
        .text;
      modules[modulePath] = [];
    }
  });
  return {};
}
