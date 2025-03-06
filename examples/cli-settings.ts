import { OrganizedAI } from '../src';
import inquirer from 'inquirer';

/**
 * A simple CLI for managing Organized AI settings
 */
async function main() {
  console.log('Organized AI Settings Manager\n');
  
  // Create an instance of Organized AI
  const organizedAI = new OrganizedAI();
  
  while (true) {
    const mainMenu = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'Select an option:',
      choices: [
        { name: 'Manage MCP Servers', value: 'servers' },
        { name: 'Manage API Keys', value: 'apikeys' },
        { name: 'Manage Environment Variables', value: 'env' },
        { name: 'Exit', value: 'exit' }
      ]
    });

    switch (mainMenu.action) {
      case 'servers':
        await manageServers(organizedAI);
        break;
      case 'apikeys':
        await manageApiKeys(organizedAI);
        break;
      case 'env':
        await manageEnvironmentVars(organizedAI);
        break;
      case 'exit':
        console.log('\nGoodbye!');
        return;
    }
  }
}

async function manageServers(organizedAI: OrganizedAI): Promise<void> {
  const serverSettings = organizedAI.getAllServerSettings();
  const serverChoices = Object.values(serverSettings).map(server => ({
    name: `${server.name} [${server.enabled ? 'Enabled' : 'Disabled'}]`,
    value: server.id
  }));

  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Server Management:',
    choices: [
      { name: 'View Server Details', value: 'view' },
      { name: 'Enable/Disable Server', value: 'toggle' },
      { name: 'Edit Server URL', value: 'url' },
      { name: 'Back to Main Menu', value: 'back' }
    ]
  });

  if (action === 'back') {
    return;
  }

  // Select a server for the chosen action
  if (serverChoices.length === 0) {
    console.log('No servers configured. Please check your settings.');
    return;
  }

  const { serverId } = await inquirer.prompt({
    type: 'list',
    name: 'serverId',
    message: 'Select a server:',
    choices: serverChoices
  });

  const server = organizedAI.getServerSettings(serverId)!;

  switch (action) {
    case 'view':
      console.log(`\nServer: ${server.name} (${server.id})`);
      console.log(`URL: ${server.url}`);
      console.log(`Status: ${server.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`Required API Keys: ${server.requiredApiKeys.length ? server.requiredApiKeys.join(', ') : 'None'}`);
      break;
      
    case 'toggle':
      try {
        const newState = !server.enabled;
        organizedAI.enableServer(serverId, newState);
        console.log(`${server.name} is now ${newState ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      break;
      
    case 'url':
      const { newUrl } = await inquirer.prompt({
        type: 'input',
        name: 'newUrl',
        message: 'Enter new server URL:',
        default: server.url
      });
      
      organizedAI.updateServerSettings(serverId, { url: newUrl });
      console.log(`URL updated for ${server.name}`);
      break;
  }
}

async function manageApiKeys(organizedAI: OrganizedAI): Promise<void> {
  const apiKeys = organizedAI.getAllApiKeys();
  const keyNames = Object.keys(apiKeys);
  
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'API Key Management:',
    choices: [
      { name: 'List API Keys', value: 'list' },
      { name: 'Add/Update API Key', value: 'add' },
      { name: 'Remove API Key', value: 'remove' },
      { name: 'Back to Main Menu', value: 'back' }
    ]
  });

  if (action === 'back') {
    return;
  }

  switch (action) {
    case 'list':
      console.log('\nAPI Keys:');
      if (keyNames.length === 0) {
        console.log('No API keys configured.');
      } else {
        keyNames.forEach(name => {
          const maskedValue = apiKeys[name].substring(0, 4) + '•'.repeat(apiKeys[name].length - 8) + apiKeys[name].slice(-4);
          console.log(`${name}: ${maskedValue}`);
        });
      }
      break;
      
    case 'add':
      const { keyName } = await inquirer.prompt({
        type: 'input',
        name: 'keyName',
        message: 'Enter API key name:',
        validate: (input) => input.trim() !== '' ? true : 'Key name is required'
      });
      
      const { keyValue } = await inquirer.prompt({
        type: 'input',
        name: 'keyValue',
        message: `Enter value for ${keyName}:`,
        validate: (input) => input.trim() !== '' ? true : 'Key value is required'
      });
      
      organizedAI.setApiKey(keyName, keyValue);
      console.log(`API key ${keyName} saved successfully.`);
      break;
      
    case 'remove':
      if (keyNames.length === 0) {
        console.log('No API keys to remove.');
        break;
      }
      
      const { keyToRemove } = await inquirer.prompt({
        type: 'list',
        name: 'keyToRemove',
        message: 'Select API key to remove:',
        choices: [...keyNames, 'Cancel']
      });
      
      if (keyToRemove !== 'Cancel') {
        organizedAI.removeApiKey(keyToRemove);
        console.log(`API key ${keyToRemove} removed.`);
      }
      break;
  }
}

async function manageEnvironmentVars(organizedAI: OrganizedAI): Promise<void> {
  const envVars = organizedAI.getAllEnvironmentVariables();
  const varNames = Object.keys(envVars);
  
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Environment Variable Management:',
    choices: [
      { name: 'List Environment Variables', value: 'list' },
      { name: 'Add/Update Environment Variable', value: 'add' },
      { name: 'Remove Environment Variable', value: 'remove' },
      { name: 'Back to Main Menu', value: 'back' }
    ]
  });

  if (action === 'back') {
    return;
  }

  switch (action) {
    case 'list':
      console.log('\nEnvironment Variables:');
      if (varNames.length === 0) {
        console.log('No environment variables configured.');
      } else {
        varNames.forEach(name => {
          console.log(`${name}: ${envVars[name]}`);
        });
      }
      break;
      
    case 'add':
      const { varName } = await inquirer.prompt({
        type: 'input',
        name: 'varName',
        message: 'Enter environment variable name:',
        validate: (input) => input.trim() !== '' ? true : 'Variable name is required'
      });
      
      const { varValue } = await inquirer.prompt({
        type: 'input',
        name: 'varValue',
        message: `Enter value for ${varName}:`,
        validate: (input) => input.trim() !== '' ? true : 'Variable value is required'
      });
      
      organizedAI.setEnvironmentVariable(varName, varValue);
      console.log(`Environment variable ${varName} saved successfully.`);
      break;
      
    case 'remove':
      if (varNames.length === 0) {
        console.log('No environment variables to remove.');
        break;
      }
      
      const { varToRemove } = await inquirer.prompt({
        type: 'list',
        name: 'varToRemove',
        message: 'Select environment variable to remove:',
        choices: [...varNames, 'Cancel']
      });
      
      if (varToRemove !== 'Cancel') {
        organizedAI.removeEnvironmentVariable(varToRemove);
        console.log(`Environment variable ${varToRemove} removed.`);
      }
      break;
  }
}

// Run the CLI
main().catch(console.error);
