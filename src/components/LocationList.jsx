import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

function locationKey(location) {
  return location.id ?? `${location.latitude}:${location.longitude}`;
}

function LocationList({ locations, onSelect, selectedLocation }) {
  if (!locations.length) {
    return null;
  }

  return (
    <Paper
      component="section"
      aria-label="Risultati ricerca luoghi"
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="overline" color="text.secondary" fontWeight={800}>
          Locations
        </Typography>
      </Box>
      <List disablePadding>
        {locations.map((location) => {
          const key = locationKey(location);
          const selected = selectedLocation && locationKey(selectedLocation) === key;

          return (
            <ListItemButton
              key={key}
              component="button"
              selected={selected}
              onClick={() => onSelect(location)}
              sx={{
                width: "100%",
                textAlign: "left",
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: 0 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LocationOnRoundedIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={location.name}
                secondary={[location.state, location.country, location.countryCode]
                  .filter(Boolean)
                  .join(", ")}
                primaryTypographyProps={{ fontWeight: 800 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}

export default LocationList;
