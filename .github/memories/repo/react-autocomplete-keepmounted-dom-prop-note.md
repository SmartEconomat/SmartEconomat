# React Autocomplete keepMounted DOM prop note

- En callbacks `renderOption` de MUI `Autocomplete`, no propagar `props` sin filtrar a elementos DOM (`li`/`div`/`Box component="li"`).
- Filtrar `keepMounted` y `key` del objeto propagado para evitar warnings de React por props internas en el DOM.
- Patrón seguro aplicado en: `RecetaIngredientesSelector`, `PedidoLineasSelector`, `ProductFilters`.