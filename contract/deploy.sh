#!/bin/sh

# build the contract
npm run build

# deploy the contract
# rm -rf neardev
near dev-deploy --wasmFile build/contract.wasm 