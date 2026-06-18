import { useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";

const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

function SearchForm({
  query,
  latitude,
  longitude,
  loading,
  onQueryChange,
  onLatitudeChange,
  onLongitudeChange,
  onSearch,
  onCoordinateSearch,
}) {
  const [validationError, setValidationError] = useState("");

  function clearValidation() {
    if (validationError) {
      setValidationError("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const cleanQuery = query.trim();
    const cleanLatitude = latitude.trim();
    const cleanLongitude = longitude.trim();

    if (cleanQuery.length >= 2) {
      setValidationError("");
      onSearch(cleanQuery);
      return;
    }

    if (cleanLatitude || cleanLongitude) {
      if (!cleanLatitude || !cleanLongitude) {
        setValidationError("Inserisci sia latitudine sia longitudine");
        return;
      }

      const lat = Number(cleanLatitude);
      const lon = Number(cleanLongitude);

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        setValidationError("Latitudine non valida");
        return;
      }

      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        setValidationError("Longitudine non valida");
        return;
      }

      setValidationError("");
      onCoordinateSearch({ latitude: lat, longitude: lon });
      return;
    }

    setValidationError("Cerca una citta o inserisci coordinate");
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", md: "flex-start" }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box component="label" htmlFor="city-search" sx={visuallyHidden}>
            Cerca una citta
          </Box>
          <TextField
            id="city-search"
            type="search"
            value={query}
            onChange={(event) => {
              clearValidation();
              onQueryChange(event.target.value);
            }}
            placeholder="Search City..."
            error={Boolean(validationError)}
            helperText={validationError}
            disabled={loading}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
        </Box>

        <TextField
          aria-label="Latitudine"
          value={latitude}
          onChange={(event) => {
            clearValidation();
            onLatitudeChange(event.target.value);
          }}
          placeholder="Lat"
          disabled={loading}
          size="small"
          sx={{ ...inputSx, width: { xs: "100%", md: 58 } }}
        />
        <TextField
          aria-label="Longitudine"
          value={longitude}
          onChange={(event) => {
            clearValidation();
            onLongitudeChange(event.target.value);
          }}
          placeholder="Long"
          disabled={loading}
          size="small"
          sx={{ ...inputSx, width: { xs: "100%", md: 58 } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            minWidth: { xs: "100%", md: 62 },
            height: 40,
            borderRadius: "8px",
            bgcolor: "#866d49",
            color: "#f4f7ff",
            boxShadow: "none",
            fontSize: 12,
            fontWeight: 900,
            "&:hover": { bgcolor: "#6d593d", boxShadow: "none" },
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Search"}
        </Button>
      </Stack>
    </Box>
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    height: 40,
    borderRadius: "8px",
    bgcolor: "rgba(28, 31, 38, 0.96)",
    color: "text.primary",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(169, 194, 255, 0.45)",
  },
  "& .MuiInputBase-input": {
    fontSize: 12,
  },
  "& .MuiFormHelperText-root": {
    position: { md: "absolute" },
    top: { md: "100%" },
    left: { md: 4 },
    mt: 0.5,
    whiteSpace: "nowrap",
  },
};

export default SearchForm;
