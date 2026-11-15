---
title: Composer tags and the artist web
---

A new data validator now forces me to add "composer" data to the APEv2 ID3 tags that are responsible for building out the entire site. Years ago, I spent a ton of time hunting down the names of everyone who has contributed music to the site. I've lost touch with some people and have completely forgotten their names, and with newer submissions I've become lazy and haven't been maintaining this data. Now, with the new validator, I'm unable to build the site without first adding these names.

The aforementioned validator allows me to accurately link artists together. During generation I'm now determining which artists are related to other artists on the site by collating their band members, which are stored in the "composer" data, to be able to produce a map linking each artist together. In other words, if Biff Smithington played drums in both Dog Boil and Smithington's Revenge, each artist page would reference the other's page, provided I've spelled everyone's name correctly. Now you can start to see just how incestuous some of the bands were over the years, and who doesn't _love_ incest?

I also did a bit of decoupling between data _generation_ and _validation_ so that I can more easily validate data without having to generate simultaneously.
