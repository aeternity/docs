# Sophia Support for Visual Studio Code

Sophia is a programming language for implementing smart contracts on the
[Æternity Blockchain](https://aeternity.com/).

This extension provides syntax highlighting for the Sophia language.

## Testing the Extension

The extension could be tested by opening it in VSCode:

```
git clone git@github.com:aeternity/aesophia-vscode.git
cd aesophia-vscode
code .
```

Then running in by going to (Run -> Start Debugging) or
(Run -> Start Without Debugging) in VSCode menu bar.

## Installation

The extension can be package and installed from the source using vsce.
Make sure you have [Node.js](https://nodejs.org/) installed. Then run:

```
npm install -g @vscode/vsce
```

From the extension directory:

```
vsce package
```

The above command will generate a file called `aesophia-{VERSION}.vsix`.
This file could be then be loaded in VSCode from
(Extensions -> Install from VSIX).
