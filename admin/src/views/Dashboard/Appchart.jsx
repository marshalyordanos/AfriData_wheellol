import React, { useState } from "react";
import Chart from "react-apexcharts";

const AppChart = ({ chartOptions, chartSeries, type }) => {
  return (
    <div className="app">
      <div className="row">
        <div className="mixed-chart">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type={type}
            width="500"
          />
        </div>
      </div>
    </div>
  );
};

export default AppChart;
