import * as Font from 'expo-font';
import MontserratRegular from '../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratBold from '../assets/fonts/Montserrat/Montserrat-Bold.ttf';
import MontserratLight from '../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratThin from '../assets/fonts/Montserrat/Montserrat-Thin.ttf';
import MontserratBlack from '../assets/fonts/Montserrat/Montserrat-Black.ttf';

import GenBasB from '../assets/fonts/Gentium-Basic/GenBasB.ttf';
import GenBasR from '../assets/fonts/Gentium-Basic/GenBasR.ttf';
import GenBasBl from '../assets/fonts/Gentium-Basic/GenBasBI.ttf';
import GenBkBasB from '../assets/fonts/Gentium-Basic/GenBkBasB.ttf';
import GenBkBasR from '../assets/fonts/Gentium-Basic/GenBkBasR.ttf';
import GenBkBasl from '../assets/fonts/Gentium-Basic/GenBkBasI.ttf';

export const loadFonts = async () => {
  await Font.loadAsync({
    'Montserrat-Regular': MontserratRegular,
    'Montserrat-Bold': MontserratBold,
    'Montserrat-Light': MontserratLight,
    'Montserrat-Thin': MontserratThin,
    'Montserrat-Black': MontserratBlack,
    'GenBasB': GenBasB,
    'GenBasR': GenBasR,
    'GenBasBI': GenBasBl,
    'GenBkBasB': GenBkBasB,
    'GenBkBasR': GenBkBasR,
    'GenBkBasI': GenBkBasl
  });
};