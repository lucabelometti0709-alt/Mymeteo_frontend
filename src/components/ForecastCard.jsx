import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { getWeatherIcon, getWeatherTone } from "../utils/weatherIcons";
import { formatWeekday } from "../utils/dateFormat";
import "./ForecastCard.css";

function ForecastCard({ day, index }) {
  const Icon = getWeatherIcon(day.weatherCode);
  const tone = getWeatherTone(day.weatherCode);
  const label = index === 0 ? "Oggi" : formatWeekday(day.date);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      className="forecast-card-stack"
    >
      <Typography
        component="span"
        className="forecast-card-label"
      >
        {label}
      </Typography>
      <Box
        component={Icon}
        aria-label={day.description}
        className="forecast-card-icon"
        sx={{ color: tone }}
      />
      <LinearProgress
        variant="determinate"
        value={Math.max(12, Math.min(100, Number(day.precipitationProbability) || 28))}
        className="forecast-card-progress"
      />
      <Typography
        component="span"
        className="forecast-card-temperature"
      >
        {Math.round(day.temperatureMax)}°/{Math.round(day.temperatureMin)}°
      </Typography>
    </Stack>
  );
}

export default ForecastCard;