import * as i18n from "@solid-primitives/i18n";
import type * as en from "./i18n/en";
import {
  ParentComponent,
  Show,
  Suspense,
  createContext,
  createResource,
  createSignal,
  onMount,
  useContext,
} from "solid-js";

export type Locale = "en" | "es";
export type RawDictionary = typeof en.dict;
export type Dictionary = i18n.Flatten<RawDictionary>;

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  const dict: RawDictionary = (await import(`./i18n/${locale}.ts`)).dict;
  return i18n.flatten(dict); // flatten the dictionary to make all nested keys available top-level
}

const I18nContext = createContext<i18n.Translator<Dictionary>>(
  {} as i18n.Translator<Dictionary>,
);

export const I18nProvider: ParentComponent = (props) => {
  const [locale, setLocale] = createSignal<Locale>("en");
  const [dict] = createResource(locale, fetchDictionary);

  onMount(() => {
    const lang = navigator.language.substring(0, 2);
    if (lang == "en" || lang == "es") {
      setLocale(lang);
    }
  });

  return (
    <Suspense>
      <Show when={dict()}>
        {(dict) => {
          const t = i18n.translator(dict);
          return (
            <I18nContext.Provider value={t}>
              {props.children}
            </I18nContext.Provider>
          );
        }}
      </Show>
    </Suspense>
  );
};

export const useT = (): i18n.Translator<Dictionary> => {
  return useContext(I18nContext);
};
