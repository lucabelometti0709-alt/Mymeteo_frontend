import { Stack } from "@mui/material";
import ForecastCard from "./ForecastCard";

function ForecastGrid({ forecast }) {
  return (
    <Stack spacing={1.35}>
      {forecast.map((day, index) => (
        <ForecastCard key={day.date} day={day} index={index} />
      ))}
    </Stack>
  );
}

export default ForecastGrid;
