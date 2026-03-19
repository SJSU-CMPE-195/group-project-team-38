#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const candidates = [
  path.join(
    projectRoot,
    "node_modules/.bun/node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm",
  ),
  path.join(
    projectRoot,
    "node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm",
  ),
];

const original = `    @try {
      [inv invokeWithTarget:strongModule];
    } @catch (NSException *exception) {
      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }
`;

const replacement = `    @try {
      [inv invokeWithTarget:strongModule];
    } @catch (NSException *exception) {
      RCTLogError(
          @"Exception thrown while invoking async method %s.%s: %@",
          moduleName,
          methodNameStr.c_str(),
          exception);
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }
`;

const target = candidates.find((candidate) => fs.existsSync(candidate));

if (!target) {
  console.warn("[postinstall] React Native RCTTurboModule.mm not found; skipping patch");
  process.exit(0);
}

const source = fs.readFileSync(target, "utf8");

if (source.includes(replacement)) {
  console.log(
    `[postinstall] React Native TurboModule patch already applied: ${path.relative(projectRoot, target)}`,
  );
  process.exit(0);
}

if (!source.includes(original)) {
  console.error(`[postinstall] Expected TurboModule snippet not found in ${target}`);
  process.exit(1);
}

fs.writeFileSync(target, source.replace(original, replacement));
console.log(
  `[postinstall] Applied React Native TurboModule patch: ${path.relative(projectRoot, target)}`,
);
