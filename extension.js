const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(
    "Activating extension 'github-compliant-license-file-generator'..."
  );

  const createLicenseFile = (licensePath, license) => {
    fs.writeFile(licensePath, license, (err) => {
      if (err) {
        vscode.window.showErrorMessage(
          `An error occurred while creating the LICENSE file: ${err.message}`
        );
        return;
      }
      vscode.window.showInformationMessage("LICENSE file created.");
      vscode.workspace.openTextDocument(licensePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    });
  };

  const buildCommandForLicense = (licenseTemplateFileName) => {
    return () => {
      let licenseText = fs.readFileSync(
        path.join(__dirname, "resources/licenses", licenseTemplateFileName),
        "utf8"
      );

      licenseText = licenseText.replace("{year}", new Date().getFullYear());

      let authorName = "";
      try {
        authorName = require("child_process")
          .execSync("git config user.name")
          .toString()
          .trim();
      } catch (e) {
        if (e.status === 1) {
          vscode.window.showErrorMessage(
            "Your git user.name is not set. Please set it in to use this extension."
          );
        } else {
          vscode.window.showErrorMessage(
            `An error occurred while trying to read your git user.name: ${e.message}`
          );
        }
        return;
      }
      licenseText = licenseText.replace("{author}", authorName);

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "No workspace folder is open. Open a workspace folder first."
        );
        return;
      }
      const rootPath = workspaceFolders[0].uri.fsPath;

      const licensePath = path.join(rootPath, "LICENSE");

      if (!fs.existsSync(licensePath)) {
        createLicenseFile(licensePath, licenseText);
        return;
      }

      vscode.window
        .showInformationMessage(
          "LICENSE file already exists. Do you want to overwrite it?",
          "Yes",
          "No"
        )
        .then((res) => {
          if (res === "Yes") {
            createLicenseFile(licensePath, licenseText);
          }
        });
    };
  };

  [
    "apacheLicense",
    "gnuGeneralPublicLicense3",
    "mitLicense",
    "bsdSimplifiedLicense",
    "bsdNewRevisedLicense",
    "boostSoftwareLicense",
    "creativeCommonsZero",
    "eclipsePublicLicense",
    "gnuAfferoGeneralPublicLicense",
    "gnuGeneralPublicLicense2",
    "gnuLesserGeneralPublicLicense",
    "mozillaPublicLicense",
    "unlicense",
  ].forEach((license) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `github-compliant-license-file-generator.${license}`,
        buildCommandForLicense(license + ".txt")
      )
    );
  });
}

function deactivate() {
  console.log(
    "Deactivating extension 'github-compliant-license-file-generator'..."
  );
}

module.exports = {
  activate,
  deactivate,
};
