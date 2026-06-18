import SunnyImg from "../img/sun.jpg";
import CloudyImg from "../img/Nuvoloso.jpg";
import LCloudyImg from "../img/nuvolosino.jpg";
import LRainImg from "../img/pioviggine.jpg";
import Nev from "../img/nevicata.jpg";
import Rain from "../img/pioggia.jpg";
import Luna from "../img/Luna.jpg";

function codeValue(code) {
  return Number(code);
}

export function getWeatherImg(code, currentTime, sunrise, sunset) {
  const value = codeValue(code);

  const now = currentTime ? new Date(currentTime) : new Date();
  const sunriseDate = sunrise ? new Date(sunrise) : null;
  const sunsetDate = sunset ? new Date(sunset) : null;

  let isNight = now.getHours() >= 20 || now.getHours() < 6;
  if (sunriseDate && sunsetDate) {
    isNight = now < sunriseDate || now > sunsetDate;
  }

  if ((value === 0 || value === 1 || value === 2) && isNight) {
    return Luna;
  }

  if (value === 0 || value === 1 || value === 2) {
    return SunnyImg;
  }

  if (value === 3) {
    return CloudyImg;
  }

  if (value >= 45 && value <= 48) {
    return LCloudyImg;
  }

  if ((value >= 51 && value <= 67) || (value >= 80 && value <= 82)) {
    return LRainImg;
  }

  if ((value >= 71 && value <= 77) || value === 85 || value === 86) {
    return Nev;
  }

  if (value >= 95 && value <= 99) {
    return Rain;
  }

      return SunnyImg;
}