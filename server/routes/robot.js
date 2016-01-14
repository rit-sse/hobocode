'use strict';

const express = require('express');
const router = express.Router();
const Robot = require('../models').Robot;

router.route('/robots/:botname?/')

  /* get a robot from the database */
  .get((req, res)=>{
    const botname = req.params.botname;
    Robot.findOne({ where: { url_name: botname } }).then((robots)=>{
      //success
      res.status(200).json(robots.toJSON());
    }).catch(err=>{
      //failure
      res.status(404).send({error: 'No robot found'});
    });
  })

  /* add a new robot to the database */
  .post((req, res)=> {
    const botname = req.body.botname;
    const botcode = req.body.code;
    const botpassword = req.body.password;
    Robot.create({ name: botname, code: botcode, password: botpassword }).then(robot=> {
      //success
      res.status(201).send(robot.toJSON());
    }).catch((err)=> {
      //error
      res.status(412).send({error: 'Robot with too similar name exists'});
    });
  })

  /* update an existing robot in the database */
  .put((req, res)=>{
    const botname = req.body.botname;
    const botcode = req.body.code;
    const botpassword = req.body.password;
    //get the existing robot
    Robot.findOne({ where: { url_name: req.params.botname } }).then((robot)=>{
      if(robot.verify(botpassword)){
        robot.updateAttributes({ code: botcode }).then((robot)=>{
          //success
          res.status(200).send(robot.toJSON());
        });
      }else{
        //error: password failed
        res.status(401).send({error: 'Incorrect password'});
      }
    }).catch((err)=>{
      //error: no bot found
      res.status(404).send({error: 'No robot found'});
    });
  });

module.exports =  router;
