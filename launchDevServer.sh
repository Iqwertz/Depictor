#!/bin/bash

echo launching Backend
cd Backend
npm run start-dev &
echo launching Frontend
cd ../
cd Frontend
ng serve