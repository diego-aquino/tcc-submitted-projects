import path from 'path';
import filesystem from 'fs';

async function completeExampleName(partialExampleName: string) {
  const availableExampleFiles = (
    await filesystem.promises.readdir(__dirname)
  ).filter((fileName) => /-(success|error)\.ts$/.test(fileName));

  const completedExampleName = availableExampleFiles.find((fileName) =>
    fileName.includes(partialExampleName),
  );

  if (!completedExampleName) {
    throw new Error(`Could not find example '${partialExampleName}'.`);
  }

  return completedExampleName.replace(/-(success|error)\.ts$/, '');
}

async function main() {
  const [exampleName, exampleType = 'success'] = process.argv.slice(2);

  const isPartialExampleName = !exampleName.includes('-');

  const actualExampleName = isPartialExampleName
    ? await completeExampleName(exampleName)
    : exampleName;

  const examplePath = path.join(
    __dirname,
    `${actualExampleName}-${exampleType}.ts`,
  );
  await import(examplePath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
