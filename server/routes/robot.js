'use strict';

const express = require('express');
const router = express.Router();
const Robot = require('../models').Robot;

router.route('/robots/:botname')
  .get((req, res)=>{
    const botname = req.params.botname;
    //res.send(botname);
    Robot.findAll({ where: { url_name: botname } }).then((robots)=>{
      res.send(robots[0]);
    });
  })
  .put(()=>{
  });

module.exports =  router;
