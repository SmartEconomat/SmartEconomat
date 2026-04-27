import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FilterListIcon from '@mui/icons-material/FilterList';

/**
 * Documentación en español.
 */
export interface SmartFilterAutocompleteProps<T> extends Omit<
  AutocompleteProps<T, true, false, false>,
  'renderInput' | 'multiple'
> {
  /**
   * Documentación en español.
   */
  placeholder?: string;
  /**
   * Documentación en español.
   */
  ariaLabel?: string;
  /**
   * Documentación en español.
   */
  icon?: ReactNode;
  /**
   * Documentación en español.
   */
  inputWidth?: string | number;
}

/**
 * Documentación en español.
 */
export function SmartFilterAutocomplete<T>({
  placeholder = 'Filtrar...',
  ariaLabel = 'Filtrar elementos',
  icon = <FilterListIcon sx={{ fontSize: 18 }} />,
  inputWidth: _inputWidth,
  sx,
  ...props
}: SmartFilterAutocompleteProps<T>) {
  void _inputWidth;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  // Función para comprobar la posición del scroll
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      // Usamos un margen de 2px para evitar problemas de precisión en browsers
      const isStart = el.scrollLeft <= 2;
      const isEnd =
        Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) <= 2;

      setAtStart(isStart);
      setAtEnd(isEnd);
    }
  }, []);

  // Escuchar scroll y cambios de contenido para actualizar el degradado
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll(); // Comprobación inicial
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll, props.value]);

  // Scroll automático al añadir nuevos elementos
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [props.value?.length]);

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      {...props}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={placeholder}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
            htmlInput: {
              ...params.inputProps,
              'aria-label': ariaLabel,
            },
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  {/* Icono de filtro identificador a la izquierda */}
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color:
                        props.value && (props.value as T[]).length > 0
                          ? 'primary.main'
                          : 'action.active',
                      ml: 0.5,
                      mr: 0.5,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {icon}
                  </Box>
                </>
              ),
              endAdornment: (
                <>
                  {/* Contenedor de chips con scroll horizontal y degradado dinámico */}
                  <Box
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      overflowX: 'auto',
                      flexWrap: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                      ml: atStart ? 0.5 : 1,
                      pr: 4.5,
                      mr: 0,
                      '&::-webkit-scrollbar': { display: 'none' },
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                      py: 0.25,
                      // Máscara de degradado inteligente
                      maskImage: `linear-gradient(to right,
                        ${atStart ? 'black' : 'transparent'},
                        black ${atStart ? '0px' : '30px'},
                        black ${atEnd ? '100%' : 'calc(100% - 30px)'},
                        ${atEnd ? 'black' : 'transparent'})`,
                      WebkitMaskImage: `linear-gradient(to right,
                        ${atStart ? 'black' : 'transparent'},
                        black ${atStart ? '0px' : '30px'},
                        black ${atEnd ? '100%' : 'calc(100% - 30px)'},
                        ${atEnd ? 'black' : 'transparent'})`,
                    }}
                  >
                    {params.InputProps.startAdornment}
                  </Box>
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      sx={{
        width: '100%',
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'divider',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        },
        ...sx,
      }}
      ListboxProps={{
        style: { maxHeight: 300 },
        ...props.ListboxProps,
      }}
    />
  );
}

export default SmartFilterAutocomplete;
