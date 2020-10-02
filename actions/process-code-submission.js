/* eslint-disable camelcase */

const core = require('@actions/core');

const fs = require('fs');

try {
  fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8', (err, data) => {
    if (err) {
      throw new Error(`ReadFile failed ${err.message}`);
    }

    const submission = JSON.parse(data);
    core.startGroup('Validation');
    if (typeof submission === 'object' && submission.languageIndex < 40 && submission.name.length >= 2 && submission.author.length >= 2 && submission.tabSize % 2 === 0 && submission.lines >= 4) {
      core.endGroup();

      core.startGroup('Reading database.json');
      const stringifiedDatabase = fs.readFileSync('server/database.json', 'utf8');
      const database = JSON.parse(stringifiedDatabase);
      core.endGroup();

      const file = {
        ...submission,
        source: submission.author,
      };
      database.laguages[submission.languageIndex].files.push(file);

<<<<<<< HEAD
      const languageName = database.laguages[submission.languageIndex].name.replace('#', '_sharp');

      core.info(`Added "${submission.name}" to ${languageName}`);
=======
      core.info(`Added "${submission.name}" to ${database.languages[submission.languageIndex].name}`);
>>>>>>> PR-test

      core.startGroup('Writing database.json');
      fs.writeFileSync('server/database.json', JSON.parse(stringifiedDatabase, null, 2));
      core.endGroup();

<<<<<<< HEAD


      const filePath = `public/code/${languageName}/${submission.name}.${database.laguages[submission.languageIndex].ext}`;
=======
      const filePath = `public/code/${database.laguages[submission.languageIndex].name.replace('#', '_sharp')}/${submission.name}.${database.laguages[submission.languageIndex].ext}`;
>>>>>>> PR-test

      core.startGroup(`Writing ${filePath}`);
      fs.writeFileSync(filePath, submission.code);
      core.endGroup();
<<<<<<< HEAD

      core.exportVariable('LANGUAGE_NAME', languageName);
=======
>>>>>>> PR-test
    } else {
      throw new Error('Invalid Submission!');
    }
  });
} catch (error) {
  core.setFailed(error.message);
}
