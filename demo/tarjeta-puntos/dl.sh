#!/bin/bash
cd /workspaces/r15studios.github.io
curl -sL -o demo/tarjeta-puntos/r15-puntos-demo.pkpass 'https://walletmcppass.com/download/5aMJ6AcssbqOtOMleotWPg'
ls -la demo/tarjeta-puntos/
git add demo/tarjeta-puntos
git commit -m 'Tarjeta puntos demo Apple Wallet (pkpass)'
git push