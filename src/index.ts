import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";

import {
    base_stats,
    nowadays_stats,
    StatsEntry
  } from "./stats";


const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");


const aProjection = d3Composite
  .geoConicConformalSpain()
  .scale(3300)
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

// Buttons 
document
  .getElementById("initial")
  .addEventListener("click", function handleBaseResults() {
    updateCases(base_stats);
  });

document
  .getElementById("current")
  .addEventListener("click", function handleCurrentResults() {
    updateCases(nowadays_stats);
  });  

// Color Scale
var color = d3
  .scaleThreshold<number, string>()
  .domain([5, 50, 100, 1000, 2500, 5000, 10000, 20000, 40000])
  .range([
    "#DEE4E4",
    "#C2C4C4",
    "#A7B0B3",
    "#929AA5",
    "#858394",
    "#7F6C7D",
    "#77555F",
    "#713D4C",
    "#564147"
  ]);


const updateCases = (data: StatsEntry[]) => {

  const maxAffected = data.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );
 
  const assignBackgroundColor = (name: string) => {
    const item = data.find(
        item => item.name === name
    );
    if (item) {
      console.log(item.value);
    }
    return item ? color(item.value) : color(0);
  };  

  svg
    .selectAll("path")
    .data(geojson["features"])
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("fill", d => assignBackgroundColor(d["properties"]["NAME_1"]))
    .attr("d", geoPath as any)
    .merge(svg.selectAll("path") as any)
    .transition()
    .duration(500)
    .attr("fill", d => assignBackgroundColor(d["properties"]["NAME_1"]));

  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, maxAffected])
    .clamp(true)
    .range([5, 45]);
  
  const calculateRadiusBasedOnAffectedCases = (comunity: string) => {  
    const entry = data.find(item => item.name === comunity);
  
    return entry ? affectedRadiusScale(entry.value) : 0;
  };

  const circles = svg.selectAll("circle");

  circles
    .data(latLongCommunities)
    .enter()
    .append("circle")
    .attr("class", "affected-marker")
    .attr("r", function(d) {
      return calculateRadiusBasedOnAffectedCases(d.name);
    })
    .attr("cx", d => aProjection([d.long, d.lat])[0])
    .attr("cy", d => aProjection([d.long, d.lat])[1])

    .merge(circles as any)
    .transition()
    .duration(500)
    .attr("r", function(d) {
      return calculateRadiusBasedOnAffectedCases(d.name);
    });
};

updateCases(base_stats);