# app-apispec-bdd

> Devebot API specification layerware

sudo mount --bind ~/projects/devebot/devebot-0.2.x/ ./node_modules/devebot/
sudo mount --bind ~/projects/devebot/app-webserver/ ./node_modules/app-webserver/

sudo umount ./node_modules/devebot/
sudo umount ./node_modules/app-webserver/
npm uninstall swagger-tools

DEBUG=devebot*,app* \
  NODE_DEVEBOT_SANDBOX=test \
  NODE_DEVEBOT_PROFILE=testbdd \
  node test/app
