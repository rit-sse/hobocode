'use strict';

const express = require('express');
const router = express.Router();
const Robot = require('../models').Robot;

router.route('/robots/:botname/:code?')

  /* get a robot from the database */
  .get((req, res)=>{
    const botname = req.params.botname;
    Robot.findAll({ where: { url_name: botname } }).then((robots)=>{
      console.log(robots);
      res.json(robots[0]);
    });
  })

  /* add a new robot to the database */
  .post((req, res)=> {
    const botname = req.params.botname;
    const botcode = req.params.code;
    Robot.create({ name: botname, code: botcode }).then(robot=> {
      //success
      res.send(robot.toJSON());
    }).catch((err)=> {
      //error
      res.send(err);
    });
  })

  /* update an existing robot in the database */
  .put((req, res)=>{
    const botname = req.params.botname;
    const botcode = req.params.code;
    //get the existing robot
    Robot.findOne({ where: { url_name: botname } }).then((robot)=>{
      robot.updateAttributes({ code: botcode }).then((robot)=>{
        //success
        res.send(robot.toJSON());
      });
    }).catch((err)=>{
      //error
      res.send(err);
    });
  });

module.exports =  router;
