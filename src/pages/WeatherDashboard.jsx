import { useEffect, useState } from "react";
import { Button, Switch, FormControlLabel } from "@mui/material";
import AirRoundedIcon from "@mui/icons-material/AirRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import WbTwilightRoundedIcon from "@mui/icons-material/WbTwilightRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import {
  Alert,
  Box,
  ButtonBase,
  CircularProgress,
  CssBaseline,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography as MuiTypography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { loadForecast, searchLocations } from "../api/weatherApi";
import LocationList from "../components/LocationList";
import SearchForm from "../components/SearchForm";
import { formatDashboardTime, formatHour, formatReadableDate } from "../utils/dateFormat";
import { getWeatherIcon, getWeatherTone } from "../utils/weatherIcons";
import { getWeatherImg } from "../utils/weatherImg";

const APP_NAME = "MyMeteo";
const RECENT_SEARCHES_KEY = "weather-stagisti:recent-searches";
const LEGACY_RECENT_SEARCHES_KEY = "auraweather:recent-searches";
const DEFAULT_LOCATION = {
  id: 3173435,
  name: "Milano",
  state: "Lombardia",
  country: "Italia",
  countryCode: "IT",
  latitude: 45.46427,
  longitude: 9.18951,
  timezone: "Europe/Rome",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#a9c2ff" },
    secondary: { main: "#f1a94e" },
    background: {
      default: "#0b0d11",
      paper: "#151922",
    },
    divider: "#94a3b821",
    text: {
      primary: "#f4f7ff",
      secondary: "#a4acba",
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    button: { textTransform: "none", fontWeight: 800 },
    allVariants: { letterSpacing: 0 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
  },
});

function Typography({
  color,
  fontSize,
  fontWeight,
  lineHeight,
  textAlign,
  sx,
  ...props
}) {
  const styleProps = {
    ...(color !== undefined ? { color } : {}),
    ...(fontSize !== undefined ? { fontSize } : {}),
    ...(fontWeight !== undefined ? { fontWeight } : {}),
    ...(lineHeight !== undefined ? { lineHeight } : {}),
    ...(textAlign !== undefined ? { textAlign } : {}),
  };
  const sxList = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return <MuiTypography {...props} sx={[styleProps, ...sxList]} />;
}

function readRecentSearches() {
  try {
    const storedValue =
      localStorage.getItem(RECENT_SEARCHES_KEY) ||
      localStorage.getItem(LEGACY_RECENT_SEARCHES_KEY);
    const value = JSON.parse(storedValue);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function persistRecentSearches(searches) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (err) {
    console.warn("Errore nel salvataggio delle ricerche", err);
  }
}

function formatLocation(location) {
  if (!location) {
    return APP_NAME;
  }

  return [location.name, location.state].filter(Boolean).join(", ");
}

function averageTemperature(day) {
  if (!day) {
    return null;
  }

  return Math.round((Number(day.temperatureMin) + Number(day.temperatureMax)) / 2);
}

function numberOrDash(value, unit = "") {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "--";
  }

  return `${Math.round(numberValue)}${unit}`;
}

function windMph(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "--";
  }

  return `${Math.round(numberValue * 0.621371)} mph`;
}

function formatTimeFromISO(isoString) {
  if (!isoString) {
    return "--:--";
  }
  
  try {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return "--:--";
  }
}

function isTimeAlreadyPassed(isoString) {
  if (!isoString) {
    return false;
  }
  
  try {
    const eventTime = new Date(isoString);
    const now = new Date();
    return eventTime < now;
  } catch (e) {
    return false;
  }
}

function calculateHoursRemaining(isoString) {
  if (!isoString) {
    return null;
  }
  
  try {
    const eventTime = new Date(isoString);
    const now = new Date();
    const diffMs = eventTime - now;
    
    if (diffMs < 0) {
      return null;
    }
    
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return hours;
  } catch (e) {
    return null;
  }
}

function WeatherStagistiLogo({ size = 30 }) {
  return (
    <Box
      component="svg"
      role="img"
      aria-label="Logo weather stagisti con sole e luna"
      viewBox="0 0 64 64"
      sx={{ width: size, height: size, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="weather-stagisti-logo-bg" x1="8" y1="8" x2="58" y2="58">
          <stop stopColor="#25344c" />
          <stop offset="1" stopColor="#101827" />
        </linearGradient>
        <linearGradient id="weather-stagisti-logo-sun" x1="13" y1="13" x2="38" y2="38">
          <stop stopColor="#ffd36a" />
          <stop offset="1" stopColor="#f39a3d" />
        </linearGradient>
        <linearGradient id="weather-stagisti-logo-moon" x1="36" y1="23" x2="52" y2="51">
          <stop stopColor="#dce8ff" />
          <stop offset="1" stopColor="#8fb0ff" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#weather-stagisti-logo-bg)" />
      <path
        d="M23 11v6M23 29v6M11 23h6M29 23h6M14.5 14.5l4.2 4.2M27.3 27.3l4.2 4.2M31.5 14.5l-4.2 4.2M18.7 27.3l-4.2 4.2"
        stroke="#ffd36a"
        strokeLinecap="round"
        strokeWidth="2.7"
      />
      <circle cx="23" cy="23" r="8.5" fill="url(#weather-stagisti-logo-sun)" />
      <path
        d="M50.5 43.6c-2.2 4.3-6.7 7.1-11.8 6.7-6.4-.6-11.1-6.2-10.6-12.5.5-5.2 4.4-9.3 9.2-10.3-1.5 2.1-2.4 4.7-2.6 7.5-.5 6.3 4 11.6 10.2 12.2 2 .2 3.9-.2 5.6-1.1Z"
        fill="url(#weather-stagisti-logo-moon)"
      />
      <circle cx="44.5" cy="33.5" r="1.6" fill="#edf4ff" opacity="0.9" />
      <circle cx="49.5" cy="38.8" r="1.1" fill="#edf4ff" opacity="0.72" />
    </Box>
  );
}

function SidebarItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <ButtonBase
      component="button"
      onClick={onClick}
      sx={{
        width: "100%",
        minHeight: 38,
        justifyContent: "flex-start",
        gap: 1.25,
        borderRadius: "8px",
        px: 1.5,
        bgcolor: active ? "#866d49" : "transparent",
        fontSize: 12,
        fontWeight: active ? 900 : 700,
        "&:hover": {
          bgcolor: active ? "#6d593d" : "rgba(148, 163, 184, 0.08)",
          color: active ? "#ffffff" : "text.primary",
        },
        "&:focus-visible": {
          outline: "2px solid #866d49",
          outlineOffset: 2,
        },
      }}
    >
      <Icon sx={{ width: 17, height: 17 }} aria-hidden="true" />
      <Box component="span">{label}</Box>
    </ButtonBase>
  );
}

function Sidebar({ activePage, onPageChange }) {
  return (
    <Box
      component="aside"
      sx={{
        minHeight: { xs: "auto", md: "100svh" },
        bgcolor: "#0d1015",
        borderRight: { md: "1px solid rgba(148, 163, 184, 0.16)" },
        px: { xs: 1.5, lg: 1.9 },
        py: 2,
        display: "flex",
        flexDirection: "column",
        gap: 4.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <WeatherStagistiLogo size={24} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            fontSize={15}
            lineHeight={1.2}
            fontWeight={900}
          >
            {APP_NAME}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.15} component="nav" aria-label="Sezioni meteo">
        <SidebarItem
          icon={DashboardRoundedIcon}
          label="Dashboard"
          active={activePage === "dashboard"}
          onClick={() => onPageChange("dashboard")}
        />
        <SidebarItem
          icon={DeviceThermostatRoundedIcon}
          label="Temperature"
          active={activePage === "temperature"}
          onClick={() => onPageChange("temperature")}
        />
        <SidebarItem
          icon={HistoryRoundedIcon}
          label="History"
          active={activePage === "history"}
          onClick={() => onPageChange("history")}
        />      
      </Stack>

      <Stack spacing={1.15} sx={{ mt: { xs: 0, md: "auto" } }}>
        <SidebarItem
          icon={HelpOutlineRoundedIcon}
          label="Help"
          active={activePage === "help"}
          onClick={() => onPageChange("help")}
        />
      </Stack>
    </Box>
  );
}

function CardShell({ children, sx = {}, ...props }) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        bgcolor: "rgba(21, 25, 34, 0.96)",
        boxShadow: "0 20px 70px rgba(0, 0, 0, 0.22)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function MetricTile({ icon: Icon, label, value, tone = "primary.main", sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: { xs: 72, md: 74 },
        p: { xs: 1.45, md: 1.55 },
        borderRadius: "8px",
        bgcolor: "rgba(32, 37, 49, 0.88)",
        border: "1px solid rgba(148, 163, 184, 0.08)",
        display: "flex",
        alignItems: "center",
        cursor: 'pointer',
        transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.05} sx={{ minWidth: 0, width: "100%" }}>
        <Icon sx={{ width: 21, height: 21, color: tone, flexShrink: 0 }} aria-hidden="true" />
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" fontSize={10} lineHeight={1.2} fontWeight={700}>
            {label}
          </Typography>
          <Typography color="text.primary" fontSize={18} lineHeight={1.35} fontWeight={500}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function CurrentWeatherPanel({ current, forecastDay, selectedLocation }) {
  const temperature = current?.temperature ?? averageTemperature(forecastDay);
  const apparentTemperature = current?.apparentTemperature ?? temperature;
  const description = current?.description ?? forecastDay?.description ?? "Loading";
  
  const ImgComponent = getWeatherIcon(
    current?.weatherCode ?? forecastDay?.weatherCode, 
    current?.time,
    forecastDay?.sunrise,
    forecastDay?.sunset,
  );

  const backgroundImage = getWeatherImg(
    current?.weatherCode ?? forecastDay?.weatherCode,
    current?.time,
    forecastDay?.sunrise,
    forecastDay?.sunset
  );

  const getLocalTimeString = () => {
    if (!current?.time) return "--:--";
    
    try {
      const localDate = new Date(current.time);
      
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (e) {
      return "--:--";
    }
  };

  return (
    <CardShell
      component="section"
      aria-labelledby="current-weather-title"
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: 310, sm: 210, md: 224 },
        p: { xs: 2.4, md: 2.8, xl: 3 },
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(300px, 32%)",
            xl: "minmax(0, 1fr) minmax(318px, 31%)",
          },
          gap: { xs: 2.2, md: 4, xl: 5 },
          alignItems: "stretch",
          height: "100%",
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: { xs: 150, sm: 155, md: 166 },
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.65}>
              <LocationOnRoundedIcon sx={{ width: 18, height: 18, color: "primary.main", flexShrink: 0 }} />
              <Typography id="current-weather-title" component="h2" fontSize={18} lineHeight={1.25} fontWeight={500} noWrap>
                {selectedLocation ? formatLocation(selectedLocation) : "Search a city"}
              </Typography>
            </Stack>
            
            <Typography color="text.primary" fontSize={16} fontWeight={400} sx={{ mt: 0.8 }}>
              Today, {getLocalTimeString()}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="flex-end" spacing={1.35} sx={{ mt: 2 }}>
            <Typography component="p" sx={{ color: "text.primary" }} fontSize={64} lineHeight={1.35} fontWeight={400}>
              {numberOrDash(temperature, "°")}
            </Typography>
            <Box sx={{ minWidth: 0, pb: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Typography color="text.primary" fontSize={16} lineHeight={1.35} fontWeight={400} noWrap>
                {description}
              </Typography>
              <Typography color="text.primary" fontSize={16} lineHeight={1.35} fontWeight={400} noWrap>
                H: {numberOrDash(forecastDay?.temperatureMax, "°")} L:{" "}
                {numberOrDash(forecastDay?.temperatureMin, "°")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: { xs: 1.4, md: 1.5 },
            alignContent: "center",
            alignSelf: "center",
          }}
        >
          <MetricTile 
            icon={WaterDropRoundedIcon} 
            label="Humidity" 
            value={numberOrDash(current?.humidity, "%")} 
          />
          <MetricTile icon={AirRoundedIcon} label="Wind" value={windMph(current?.windSpeed ?? forecastDay?.windSpeed)} />
          <MetricTile icon={CompressRoundedIcon} label="Pressure" value={numberOrDash(current?.pressure, " hPa")} />
          <MetricTile
            icon={DeviceThermostatRoundedIcon}
            label="Feels Like"
            value={numberOrDash(apparentTemperature, "°")}
            tone="secondary.main"
          />
          {!isTimeAlreadyPassed(forecastDay?.sunrise) && (
            <MetricTile icon={WbSunnyRoundedIcon} label="Sunrise" value={formatTimeFromISO(forecastDay?.sunrise)} />
          )}
          {!isTimeAlreadyPassed(forecastDay?.sunset) && (
            <MetricTile icon={WbTwilightRoundedIcon} label="Sunset" value={formatTimeFromISO(forecastDay?.sunset)} />
          )}
        </Box>
      </Box>
    </CardShell>
  );
}

function ForecastTabs({ value, onChange }) {
  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "center" }}>
      <Tabs
        value={value}
        onChange={(event, nextValue) => onChange(nextValue)}
        aria-label="Forecast range"
        sx={{
          minHeight: 48,
          "& .MuiTabs-indicator": { bgcolor: "primary.main" },
          "& .MuiTab-root": {
            minHeight: 48,
            color: "text.secondary",
            fontSize: 12,
            fontWeight: 800,
            px: 2,
          },
          "& .Mui-selected": { color: "primary.main" },
        }}
      >
        <Tab value="hourly" label="Hourly" />
        <Tab value="weekly" label="Weekly" />
        <Tab value="temp" label="Temperature"/>
      </Tabs>
    </Box>
  );
}

function ForecastCard({ item, fallbackIndex = 0, weekly = false, sunrise, sunset }) {
  const iconTime = weekly && item?.date ? `${item.date}T12:00` : item?.time || item?.date;
  const iconSunrise = weekly ? item?.sunrise : sunrise;
  const iconSunset = weekly ? item?.sunset : sunset;
  const IconComponent = getWeatherIcon(
    item?.weatherCode,
    iconTime,
    iconSunrise,
    iconSunset
  );
  const tone = getWeatherTone(item?.weatherCode);
  const temperature = weekly ? item?.temperatureMax : item?.temperature;
  const label = weekly
    ? formatReadableDate(item?.date).split(" ")[0]
    : item?.time
      ? formatHour(item.time)
      : "--";

  return (
    <CardShell
      sx={{
        width: "100%",
        minWidth: 0,
        height: { xs: 146, lg: 160 },
        p: { xs: 1.15, lg: 1.5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: fallbackIndex === 0 ? "rgba(24, 28, 37, 0.98)" : "rgba(20, 24, 32, 0.96)",
      }}
    >
      <Box>
        <Typography color="text.secondary" fontSize={{ xs: 11, lg: 12 }} fontWeight={800}>
          {label}
        </Typography>
      </Box>
      {IconComponent ? (
        <IconComponent
          aria-label={item?.description ?? "Forecast"}
          sx={{ width: { xs: 26, lg: 30 }, height: { xs: 26, lg: 30 }, color: tone }}
        />
      ) : (
        <Box
          sx={{ width: { xs: 26, lg: 30 }, height: { xs: 26, lg: 30 }, color: tone }}
          aria-label="Weather icon not available"
        />
      )}
      <Typography fontSize={{ xs: 20, lg: 23 }} fontWeight={900}>
        {numberOrDash(temperature, "°")}
      </Typography>
      <Typography color="primary.main" fontSize={10} fontWeight={800}>
        Rain {numberOrDash(item?.precipitationProbability, "%")}
      </Typography>
      <Divider flexItem sx={{ borderColor: "rgba(148, 163, 184, 0.12)" }} />
      <Typography
        color="text.secondary"
        fontSize={{ xs: 8.5, lg: 10 }}
        lineHeight={1.25}
        textAlign="center"
        fontWeight={800}
        sx={{
          width: "100%",
          minHeight: 22,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          whiteSpace: "pre-line",
        }}
      >
        {weekly
          ? `L: ${numberOrDash(item?.temperatureMin, "°")} Wind ${numberOrDash(item?.windSpeed)}`
          : fallbackIndex === 0
            ? item?.description
            : item?.description}
      </Typography>
    </CardShell>
  );
}

function TemperatureCard({ item, minTemperature, maxTemperature, compact = false }) {
  const temperature = Number(item?.temperature) || 0;
  const range = maxTemperature - minTemperature || 1;
  const percentage = ((temperature - minTemperature) / range) * 100;
  const label = item?.time ? formatHour(item.time) : item?.date || "--";

  return (
    <CardShell
      sx={{
        p: { xs: 1.15, lg: 1.5 },
        minHeight: { xs: 100, lg: 110 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography color="text.secondary" fontSize={{ xs: 11, lg: 12 }} fontWeight={800}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ my: 1 }}>
        <Box
          sx={{
            width: "100%",
            height: 6,
            borderRadius: 1,
            bgcolor: "rgba(148, 163, 184, 0.12)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${Math.max(5, Math.min(95, percentage))}%`,
              height: "100%",
              bgcolor: "primary.main",
              borderRadius: 1,
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>
      <Typography fontSize={{ xs: 18, lg: 20 }} fontWeight={900}>
        {numberOrDash(temperature, "°")}
      </Typography>
    </CardShell>
  );
}

function ForecastStrip({ tab, hourly, forecast }) {
  const todayString = forecast?.[0]?.date ?? new Date().toLocaleDateString("sv-SE");

  const hourlyItemsOfTheDay = Array.isArray(hourly)
    ? hourly.filter(item => item.time && item.time.startsWith(todayString))
    : [];

  if (tab === "temp") {
    const temperatureItems = hourlyItemsOfTheDay.length
      ? hourlyItemsOfTheDay
      : Array.isArray(forecast) ? forecast.slice(0, 5) : [];

    const temperatures = temperatureItems
      .map(item => Number(item?.temperature ?? item?.temperatureMax ?? 0))
      .filter(Number.isFinite);

    const minTemperature = temperatures.length ? Math.min(...temperatures) : 0;
    const maxTemperature = temperatures.length ? Math.max(...temperatures) : 40;

    return (
      <Box
        sx={{
          pt: 3,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: `repeat(${Math.min(temperatureItems.length || 1, 5)}, minmax(0, 1fr))`,
          },
          gap: { xs: 1.25, lg: 1.5 },
        }}
      >
        {temperatureItems.length ? (
          temperatureItems.map((item, index) => (
            <TemperatureCard
              key={item.time ?? item.date ?? index}
              item={item}
              minTemperature={minTemperature}
              maxTemperature={maxTemperature}
              compact
            />
          ))
        ) : (
          <TemperatureCard item={{}} minTemperature={0} maxTemperature={40} compact />
        )}
      </Box>
    );
  }

  const items =
    tab === "weekly"
      ? (Array.isArray(forecast) ? forecast : []).slice(0, 8)
      : (hourlyItemsOfTheDay.length
        ? hourlyItemsOfTheDay
        : Array.from({ length: 1 }, (_, index) => ({ index })));

  const todayForecast = Array.isArray(forecast) ? forecast[0] : null;
  const sunrise = todayForecast?.sunrise;
  const sunset = todayForecast?.sunset;

  return (
    <Box
      sx={{
        pt: 3,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: `repeat(${Math.min(items.length, 6)}, minmax(0, 1fr))`,
          xl: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))`,
        },
        gap: { xs: 1.25, lg: 1.5 },
      }}
    >
      {items.map((item, index) => (
        <ForecastCard
          key={item.time ?? item.date ?? index}
          item={item}
          fallbackIndex={index}
          weekly={tab === "weekly"}
          sunrise={sunrise}
          sunset={sunset}
        />
      ))}
    </Box>
  );
}

function TemperaturePage({ current, forecast, hourly, selectedLocation }) {
  const temps = Array.isArray(hourly) && hourly.length > 0
  ? hourly.slice(0, 24).map(item => Number(item?.temperature) || 0)
  : [20, 22, 18, 25, 23];

const maxTemp = Math.max(...temps);
  return (
    <Box component="section" aria-labelledby="temperature-title">
      <Box sx={{ mb: 2.5 }}>
        <Typography
          id="temperature-title"
          component="h2"
          fontSize={{ xs: 24, lg: 30 }}
          fontWeight={900}
        >
          Temperature Trend
        </Typography>
        <Typography color="text.secondary" fontSize={13} fontWeight={700}>
          {selectedLocation ? formatLocation(selectedLocation) : "Select a location"}
        </Typography>
      </Box>

      <LineChart
        yAxis={[
    {
      min: 0,
      max: maxTemp,
    }
  ]}
  series={[
    {
      data: temps,
      label: 'Temperature (°C)',
      curve: 'natural',
    },
  ]}
        xAxis={[{
          data: Array.isArray(hourly) && hourly.length > 0
            ? hourly.slice(0, 24).map((_, i) => i)
            : [1, 2, 3, 4, 5],
          scaleType: 'linear',
        }]}
        series={[
          {
            data: Array.isArray(hourly) && hourly.length > 0
              ? hourly.slice(0, 24).map(item => Number(item?.temperature) || 0)
              : [20, 22, 18, 25, 23],
            label: 'Temperature (°C)',
            curve: 'natural',
          },
        ]}
        width={500}
        height={300}
        margin={{ top: 10, bottom: 20, left: 60, right: 10 }}
      />
    </Box>
  );
}

function formatHistoryDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function HistoryPage({ searches, onOpenSearch }) {
  return (
    <Box component="section" aria-labelledby="history-title">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography id="history-title" component="h2" fontSize={{ xs: 24, lg: 30 }} fontWeight={900}>
            History
          </Typography>
          <Typography color="text.secondary" fontSize={13} fontWeight={700}>
            {searches.length} Ricerche salvate nel local Storage del browser.
          </Typography>
        </Box>
      </Stack>

      {searches.length ? (
        <Stack spacing={1.4}>
          {searches.map((search) => {
            const IconComponent = getWeatherIcon(search.weatherCode, search.time, search.sunrise, search.sunset);
            const canOpen =
              Number.isFinite(Number(search.latitude)) &&
              Number.isFinite(Number(search.longitude));

            return (
              <ButtonBase
                key={search.id}
                component="button"
                disabled={!canOpen}
                onClick={() => onOpenSearch(search)}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  justifyContent: "stretch",
                  borderRadius: "8px",
                  cursor: canOpen ? "pointer" : "default",
                  "&:focus-visible": {
                    outline: "2px solid #866d49",
                    outlineOffset: 2,
                  },
                }}
              >
                <CardShell
                  sx={{
                    width: "100%",
                    minHeight: { xs: 168, md: 118 },
                    p: { xs: 2, md: 2.2 },
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "minmax(220px, 1.35fr) minmax(150px, 0.8fr) minmax(190px, 1fr) minmax(120px, 0.55fr)",
                    },
                    alignItems: "center",
                    gap: { xs: 1.6, md: 2.4 },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                    {IconComponent ? (
                      <IconComponent
                        aria-hidden="true"
                        sx={{
                          width: 38,
                          height: 38,
                          color: getWeatherTone(search.weatherCode),
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: "rgba(148, 163, 184, 0.1)",
                          borderRadius: "4px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontSize={{ xs: 18, md: 20 }} fontWeight={900} noWrap>
                        {search.name || "Ricerca"}
                      </Typography>
                      <Typography color="text.secondary" fontSize={12} fontWeight={700} noWrap>
                        {[search.state, search.country].filter(Boolean).join(", ") || "Coordinate salvate"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <Typography color="text.secondary" fontSize={10} fontWeight={900}>
                      METEO
                    </Typography>
                    <Typography color="primary.main" fontSize={14} fontWeight={900}>
                      {search.description || "--"}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12} fontWeight={700}>
                      Temperatura {numberOrDash(search.temperature, "°")}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography color="text.secondary" fontSize={10} fontWeight={900}>
                      DETTAGLI
                    </Typography>
                    <Typography fontSize={13} fontWeight={800}>
                      Lat {Number.isFinite(Number(search.latitude)) ? Number(search.latitude).toFixed(4) : "--"}
                    </Typography>
                    <Typography fontSize={13} fontWeight={800}>
                      Lon {Number.isFinite(Number(search.longitude)) ? Number(search.longitude).toFixed(4) : "--"}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12} fontWeight={700} noWrap>
                      {search.countryCode && `Paese ${search.countryCode}`}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <Typography color={canOpen ? "secondary.main" : "text.secondary"} fontSize={12} fontWeight={900}>
                      {canOpen ? "Apri forecast" : "Solo storico"}
                    </Typography>
                  </Box>

                  <IconButton
                    aria-label="Rimuovi ricerca"
                    onClick={(event) => {
                      event.stopPropagation();
                      const updatedSearches = searches.filter((s) => s.id !== search.id);
                      persistRecentSearches(updatedSearches);
                      window.location.reload();
                    }}
                    sx={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 28,
                      height: 28,
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <CloseRoundedIcon sx={{ width: 18, height: 18 }} />
                  </IconButton>
                </CardShell>
              </ButtonBase>
            );
          })}
        </Stack>
      ) : (
        <CardShell sx={{ p: 3, minHeight: 180, display: "grid", placeItems: "center" }}>
          <Stack alignItems="center" spacing={1}>
            <HistoryRoundedIcon sx={{ width: 34, height: 34, color: "text.secondary" }} />
            <Typography fontSize={16} fontWeight={900}>
              Nessuna ricerca salvata
            </Typography>
            <Typography color="text.secondary" fontSize={13} textAlign="center" fontWeight={700}>
              Cerca una citta o coordinate: dopo aver caricato il forecast apparira qui.
            </Typography>
          </Stack>
        </CardShell>
      )}
    </Box>
  );
}

function HelpPage() {
  const helpItems = [
    {
      title: "Dashboard",
      body: "Mostra il meteo della localita selezionata, le metriche principali e la previsione oraria o settimanale.",
    },
    {
      title: "Ricerca",
      body: "Puoi cercare una citta oppure inserire latitudine e longitudine. Milano viene caricata come localita iniziale.",
    },
    {
      title: "History",
      body: "Ogni forecast aperto viene salvato nel localStorage del browser e resta disponibile nella pagina History.",
    },
    {
      title: "Dati",
      body: "Il backend usa Open-Meteo, normalizza i dati e restituisce previsioni a cinque giorni senza richiedere login.",
    },
  ];

  return (
    <Box component="section" aria-labelledby="help-title">
      <Box sx={{ mb: 2.5 }}>
        <Typography id="help-title" component="h2" fontSize={{ xs: 24, lg: 30 }} fontWeight={900}>
          Help
        </Typography>
        <Typography color="text.secondary" fontSize={13} fontWeight={700}>
          Informazioni rapide su come funziona weather stagisti.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 1.5,
        }}
      >
        {helpItems.map((item) => (
          <CardShell key={item.title} sx={{ p: 2.4, minHeight: 150 }}>
            <Stack spacing={1}>
              <Typography component="h3" fontSize={18} fontWeight={900}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" fontSize={14} lineHeight={1.65} fontWeight={700}>
                {item.body}
              </Typography>
            </Stack>
          </CardShell>
        ))}
      </Box>
    </Box>
  );
}

function DebugJsonPanel({ rawData, showDebug, onToggleDebug }) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <FormControlLabel
          control={<Switch checked={showDebug} onChange={onToggleDebug} />}
          label="Mostra JSON grezzo da API"
          sx={{ m: 0 }}
        />
      </Box>

      {showDebug && rawData && (
        <CardShell
          sx={{
            p: 2,
            maxHeight: 500,
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: 11,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <Typography
            component="pre"
            sx={{
              m: 0,
              color: "text.secondary",
              fontSize: 11,
              fontFamily: "monospace",
              lineHeight: 1.4,
            }}
          >
            {rawData}
          </Typography>
        </CardShell>
      )}
    </>
  );
}

function WeatherDashboard() {
  const [query, setQuery] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [forecastPayload, setForecastPayload] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [forecastTab, setForecastTab] = useState("hourly");
  const [activePage, setActivePage] = useState("dashboard");
  const [temperatureUnit, setTemperatureUnit] = useState("C");
  const [rawData, setRawData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const toggleTemperatureUnit = () => {
    setTemperatureUnit((u) => (u === "C" ? "F" : "C"));
  };

  const handleSearchCity = async (lat, lon) => {
    const data = await loadForecast(lat, lon);
  };

  const forecast = forecastPayload?.forecast ?? [];
  const currentDay = forecast[0] ?? null;
  const current = forecastPayload?.current ?? null;
  const hourly = forecastPayload?.hourly ?? [];

  useEffect(() => {
    let active = true;

    async function loadDefaultForecast() {
      try {
        const payload = await loadForecast(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude,
        );

        if (!active) {
          return;
        }

        setForecastPayload(payload);
        setRawData(JSON.stringify(payload, null, 2));
      } catch (defaultError) {
        if (active) {
          console.error("Errore caricamento previsione predefinita:", defaultError);
          setError(defaultError?.message || "Errore nel caricamento dei dati");
        }
      } finally {
        if (active) {
          setLoadingForecast(false);
        }
      }
    }

    loadDefaultForecast();

    return () => {
      active = false;
    };
  }, []);

  async function handleSearch(cleanQuery) {
    setActivePage("dashboard");
    setError("");
    setLocations([]);
    setForecastPayload(null);
    setSelectedLocation(DEFAULT_LOCATION);
    setLoadingLocations(true);

    try {
      const results = await searchLocations(cleanQuery);
      setLocations(results);

      if (!results.length) {
        setError("Nessun luogo trovato per questa ricerca.");
      }
    } catch (searchError) {
      console.error("Errore ricerca:", searchError);
      setError(searchError?.message || "Errore nella ricerca");
    } finally {
      setLoadingLocations(false);
    }
  }

  async function loadLocationForecast(location, remember = true) {
    setActivePage("dashboard");
    setSelectedLocation(location);
    setLocations([]);
    setError("");
    setLoadingForecast(true);

    try {
      const payload = await loadForecast(location.latitude, location.longitude);
      setForecastPayload(payload);
      setRawData(JSON.stringify(payload, null, 2));

      if (remember) {
        rememberSearch(location, payload);
      }
    } catch (forecastError) {
      console.error("Errore caricamento forecast:", forecastError);
      setForecastPayload(null);
      setError(forecastError?.message || "Errore nel caricamento della previsione");
    } finally {
      setLoadingForecast(false);
    }
  }

  function handleCoordinateSearch(coords) {
    const coordinateLocation = {
      id: `coords:${coords.latitude}:${coords.longitude}`,
      name: "Coordinate",
      state: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      country: "",
      countryCode: "",
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: "auto",
    };

    loadLocationForecast(coordinateLocation);
  }

  function handleOpenHistorySearch(search) {
    loadLocationForecast(
      {
        id: search.locationKey ?? search.id,
        name: search.name,
        state: search.state ?? null,
        country: search.country ?? "",
        countryCode: search.countryCode ?? "",
        latitude: search.latitude,
        longitude: search.longitude,
        timezone: "auto",
      },
      false,
    );
  }

  function rememberSearch(location, payload) {
    const firstDay = payload.forecast[0];
    const record = {
      id: `${location.id ?? `${location.latitude}:${location.longitude}`}-${Date.now()}`,
      locationKey: location.id ?? `${location.latitude}:${location.longitude}`,
      name: [location.name, location.countryCode].filter(Boolean).join(", "),
      state: location.state ?? null,
      country: location.country ?? "",
      countryCode: location.countryCode,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString(),
      description: payload.current?.description ?? firstDay.description,
      temperature: payload.current?.temperature ?? averageTemperature(firstDay),
      weatherCode: payload.current?.weatherCode ?? firstDay.weatherCode,
    };

    setRecentSearches((previous) => {
      const next = [
        record,
        ...previous.filter((item) => item.locationKey !== record.locationKey),
      ].slice(0, 8);
      persistRecentSearches(next);
      return next;
    });
  }

  const loading = loadingLocations || loadingForecast;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100svh",
          bgcolor: "background.default",
          color: "text.primary",
          display: "flex",
          justifyContent: { xs: "stretch", md: "center" },
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            minHeight: "100svh",
            width: {
              xs: "100%",
              md: "min(100%, 1060px)",
              xl: "min(100%, 1180px)",
            },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "clamp(154px, 18%, 210px) minmax(0, 1fr)",
            },
            overflow: "hidden",
            borderInline: { md: "1px solid rgba(148, 163, 184, 0.08)" },
          }}
        >
          <Sidebar activePage={activePage} onPageChange={setActivePage} />

          <Box
            component="main"
            sx={{
              px: { xs: 2, md: 3, xl: 4 },
              py: { xs: 2, md: 2.4, xl: 3 },
              minWidth: 0,
            }}
          >
            <Stack spacing={{ xs: 3, xl: 3.5 }}>
              <SearchForm
                query={query}
                latitude={latitude}
                longitude={longitude}
                loading={loading}
                onQueryChange={setQuery}
                onLatitudeChange={setLatitude}
                onLongitudeChange={setLongitude}
                onSearch={handleSearch}
                onCoordinateSearch={handleCoordinateSearch}
              />

              {error ? (
                <Alert
                  severity="warning"
                  role="alert"
                  action={
                    <IconButton aria-label="Close alert" color="inherit" size="small" onClick={() => setError("")}>
                      <CloseRoundedIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{ borderRadius: "8px" }}
                >
                  {error}
                </Alert>
              ) : null}

              {locations.length ? (
                <LocationList
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelect={(location) => loadLocationForecast(location)}
                />
              ) : null}

              {activePage === "history" && (
                <HistoryPage searches={recentSearches} onOpenSearch={handleOpenHistorySearch} />
              )}

              {activePage === "temperature" && (
                <TemperaturePage
                  current={current}
                  forecast={forecast}
                  hourly={hourly}
                  selectedLocation={selectedLocation}
                />
              )}

              {activePage === "help" && <HelpPage />}

              {activePage === "dashboard" && (
                <>
                  <Box sx={{ position: "relative" }}>
                    {loadingForecast ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.2}
                        sx={{
                          position: "absolute",
                          right: 14,
                          top: 14,
                          zIndex: 2,
                          px: 1.2,
                          py: 0.8,
                          borderRadius: "8px",
                          bgcolor: alpha("#0b0d11", 0.72),
                        }}
                      >
                        <CircularProgress size={16} />
                        <Typography fontSize={11} fontWeight={900}>
                          Loading
                        </Typography>
                      </Stack>
                    ) : null}
                    <CurrentWeatherPanel
                      current={current}
                      forecastDay={currentDay}
                      selectedLocation={selectedLocation}
                      temperatureUnit={temperatureUnit}
                      onToggleUnit={toggleTemperatureUnit}
                    />
                  </Box>

                  <Box>
                    <ForecastTabs value={forecastTab} onChange={setForecastTab} />
                    <ForecastStrip tab={forecastTab} hourly={hourly} forecast={forecast} />
                  </Box>

                  <Tooltip title="Storico salvato nel localStorage del browser">
                    <Typography color="text.secondary" fontSize={11} fontWeight={700} sx={{ width: "fit-content" }}>
                      {recentSearches.length} local history item{recentSearches.length === 1 ? "" : "s"}
                    </Typography>
                  </Tooltip>
                  <DebugJsonPanel 
                    rawData={rawData} 
                    showDebug={showDebug} 
                    onToggleDebug={() => setShowDebug(!showDebug)} 
                  />
                </>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default WeatherDashboard;