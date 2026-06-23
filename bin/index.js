#!/usr/bin/env node

import { Command } from 'commander';
import { input } from '@inquirer/prompts'

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process'
import { 
  apiresponse, 
  appTs,
  dbTs,
  env,
  indexTs,
  definePackageJson,
  tsConfig,
  wwwwJs
} from './files.js'

const program = new Command();


async function startVite(clientProjectName){
      const viteInput = await input({
      message:'Would you like create a client-side application ?: (y/n)',
      required:false
    })

    if(viteInput.trim() === 'y'){
        console.log(chalk.blue('\n🚀 Kicking off Vite process...\n'));        
        const viteProcess = spawn('npm', ['create', 'vite@latest',' ',`${clientProjectName}`], {
          cwd: process.cwd(), 
          stdio: 'inherit',   
          shell: true    
        });

        viteProcess.on('close', async (code) => {
          if (code === 0) {
            console.log(chalk.green('\n\n✨ Client application successfully scaffolded with Vite!\n\n'));

              const tanStackInput = await input({
                message:'One last thing .. Would you like create include tanstack query ? (y/n)',
                required:false
              })

              if(tanStackInput === 'y'){
                const tanStack = spawn('npm',['install','@tanstack/react-query'],{
                  cwd:path.join(process.cwd(),clientProjectName),
                  stdio:'inherit',
                  shell:true
                })

                tanStack.on('close',()=>{
                  console.log(chalk.green('\n\n✨ All Set !\n\n'));
                })

              }

          } else {
            console.log(chalk.red(`\nVite scaffolding exited with code ${code}`));
          }
        });
    }
    else {
      console.log('\nNext steps:');
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan('  npm install'));
      console.log(chalk.cyan('  npm run start\n'));
    }
}

program
  .name('blux')
  .description('A simple CLI to scaffold a TypeScript boilerplate project for blu projects')
  .version('1.0.0');


program
  .command('init')
  .argument('<api-name>', 'Used to create express server')
  .argument('[client-project-name]','Optional vite set up')
  .description('Scaffold a new TypeScript project')
  .showHelpAfterError('\nThis tool has one required and one optional arguments: <required-api-name>  <optional-client-project-name>\n')
  .action(async (projectName,clientName) => {
    const targetDir = path.resolve(process.cwd(), projectName);

    // 1. Check if directory already exists
    if (await fs.pathExists(targetDir)) {
      console.error(chalk.red(`\n❌ Error: Directory "${projectName}" already exists.`));
      process.exit(1);
    }

    console.log(chalk.blue(`\n🚀 Creating a new TypeScript project in ${chalk.bold(targetDir)}...\n`));

    try {
      // 2. Create directory structure
      const gitignore = `node_modules/\ndist/\n.env`;

      // 4. Write files to target directory
      await fs.ensureDir(path.join(targetDir,'dist'))
      await fs.outputJson(path.join(targetDir, 'package.json'), definePackageJson(projectName), { spaces: 2 });
      await fs.outputJson(path.join(targetDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
      await fs.outputFile(path.join(targetDir,'.env'),env)
      await fs.outputFile(path.join(targetDir, '.gitignore'), gitignore);
      await fs.outputFile(path.join(targetDir,'src' ,'app.ts'), appTs);
      await fs.outputFile(path.join(targetDir,'src','bin','www.ts'),wwwwJs)
      await fs.outputFile(path.join(targetDir,'src','routes','index.ts'),indexTs)
      await fs.outputFile(path.join(targetDir,'src','db','db.ts'),dbTs)
      await fs.outputFile(path.join(targetDir,'src','interfaces','apiresponse.ts'),apiresponse)

      const gitForapi = await input({
        message:'Would you like to run git init locally?: (y/n)',
        required:false
      })

      if(gitForapi === 'y'){
          spawn('git',['init'],{
            cwd:path.join(targetDir),
            stdio:'inherit',
            shell:true
          })
          .on('error',(err) => {
            console.log(chalk.yellowBright('‼ An error occured with git command', err))
          })
          .on('close',async (code) =>{
            if (code === 0) {
              console.log(chalk.green('\n\n✨ Git has been set up locally !'));

              console.log(chalk.green(`\n\n✨ Successfully scaffolded ${chalk.bold(projectName)}!\n\n`));


              if(clientName){
                await fs.pathExists(clientName) ? console.error(chalk.red(`\n❌ Error: Directory "${projectName}" already exists.`)) : await startVite(clientName)
              }


            } else {
              console.log(chalk.red(`\n\nVite scaffolding exited with code ${code}`));
            }
          })
      }else{
        console.log(chalk.magenta('\n\n❌ No git no problem'))
        console.log(chalk.green(`\n\n✨ Successfully scaffolded ${chalk.bold(projectName)}!\n\n`));

      }
      
    } catch (err) {
      if(err.message){
        console.error(chalk.red(err.message))
      }{
        console.error(chalk.red('❌ Something went wrong during generation:'), err);
      }
    }
})


program.parse(process.argv);