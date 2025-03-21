echo "Deleting android folder, node_modules, and yarn.lock..."
rm -rf android ios node_modules yarn.lock

echo "Switching to Node.js v20.10.0 using NVM..."
nvm use v20.10.0

echo "Cleanup complete!"

echo "can you Install the Packages?"
read -p "Press Enter to continue"
yarn install
