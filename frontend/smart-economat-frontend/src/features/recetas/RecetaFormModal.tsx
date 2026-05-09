import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicFormModal, {
  DynamicField,
  DynamicFormModalProps,
} from '../../components/ui/DynamicFormModal';
import { toOptionalTrimmedString } from '../../services/api.utils';
import { calculateRecetaPreviewCost } from '../../services/receta.service';
import {
  DificultadReceta,
  RecetaPreviewCostPayload,
  UnidadIngrediente,
} from '../../services/receta.types';
import { parseLocalizedNumber } from '../../utils/numberUtils';

const COST_PREVIEW_DEBOUNCE_MS = 250;

const isUnidadIngrediente = (value: unknown): value is UnidadIngrediente =>
  typeof value === 'string' &&
  Object.values(UnidadIngrediente).includes(value as UnidadIngrediente);

const parseNumberLike = (value: unknown): number | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    return parseLocalizedNumber(value);
  }

  return null;
};

const normalizePreviewIngredients = (
  rawValue: unknown
): RecetaPreviewCostPayload['ingredientes'] => {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue.reduce<RecetaPreviewCostPayload['ingredientes']>(
    (acc, line) => {
      if (!line || typeof line !== 'object') {
        return acc;
      }

      const lineRecord = line as Record<string, unknown>;
      const nestedProducto = lineRecord.producto;

      const nestedProductoId =
        nestedProducto && typeof nestedProducto === 'object'
          ? toOptionalTrimmedString(
              (nestedProducto as Record<string, unknown>).id
            )
          : undefined;

      const productoId =
        toOptionalTrimmedString(lineRecord.productoId) || nestedProductoId;

      if (!productoId) {
        return acc;
      }

      const cantidad = parseNumberLike(lineRecord.cantidad);
      if (!cantidad || cantidad <= 0) {
        return acc;
      }

      if (!isUnidadIngrediente(lineRecord.unidad)) {
        return acc;
      }

      const mermaAplicada = parseNumberLike(lineRecord.mermaAplicada);
      const proveedorFavoritoId = toOptionalTrimmedString(
        lineRecord.proveedorFavoritoId
      );

      acc.push({
        productoId,
        cantidad,
        unidad: lineRecord.unidad,
        ...(mermaAplicada !== null && mermaAplicada >= 0
          ? { mermaAplicada }
          : {}),
        ...(proveedorFavoritoId ? { proveedorFavoritoId } : {}),
      });

      return acc;
    },
    []
  );
};

const normalizePreviewRendimiento = (value: unknown): number | undefined => {
  const parsedValue = parseNumberLike(value);
  if (parsedValue === null || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
};

type RecetaFormModalProps = Pick<
  DynamicFormModalProps,
  'isOpen' | 'onClose' | 'initialData' | 'onSubmit' | 'isSubmitting'
> & {
  title?: DynamicFormModalProps['title'];
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const RecetaFormModal: React.FC<RecetaFormModalProps> = ({
  isOpen,
  onClose,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  title,
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(initialData.id);
  const [valueUpdates, setValueUpdates] = useState<Record<string, unknown>>({});
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const previewRequestIdRef = useRef(0);
  const lastPreviewSignatureRef = useRef('');
  const lastPreviewCostRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
    }

    previewRequestIdRef.current += 1;
    lastPreviewSignatureRef.current = '';
    lastPreviewCostRef.current = undefined;
    setValueUpdates({});
  }, [isOpen]);

  const handleValuesChange = useCallback((data: Record<string, unknown>) => {
    const ingredientes = normalizePreviewIngredients(data.ingredientes);
    const rendimiento = normalizePreviewRendimiento(data.rendimiento);

    const signature = JSON.stringify({ ingredientes, rendimiento });
    if (signature === lastPreviewSignatureRef.current) {
      return;
    }

    lastPreviewSignatureRef.current = signature;

    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
    }

    if (ingredientes.length === 0) {
      if (lastPreviewCostRef.current !== 0) {
        lastPreviewCostRef.current = 0;
        setValueUpdates((prev) =>
          prev.costeUnitarioEstimado === 0
            ? prev
            : { ...prev, costeUnitarioEstimado: 0 }
        );
      }
      return;
    }

    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;

    previewDebounceRef.current = setTimeout(() => {
      void calculateRecetaPreviewCost({ ingredientes, rendimiento })
        .then((response) => {
          if (previewRequestIdRef.current !== requestId) {
            return;
          }

          const previewCost = Number(
            response.costoUnitarioEstimado ?? response.costoTotal ?? 0
          );
          const normalizedCost = Number.isFinite(previewCost)
            ? Number(previewCost.toFixed(4))
            : 0;

          if (lastPreviewCostRef.current === normalizedCost) {
            return;
          }

          lastPreviewCostRef.current = normalizedCost;
          setValueUpdates((prev) =>
            prev.costeUnitarioEstimado === normalizedCost
              ? prev
              : { ...prev, costeUnitarioEstimado: normalizedCost }
          );
        })
        .catch(() => {
          if (previewRequestIdRef.current !== requestId) {
            return;
          }
        });
    }, COST_PREVIEW_DEBOUNCE_MS);
  }, []);

  const recetaFormSchema: DynamicField[] = [
    {
      name: 'nombre',
      label: t('recipes.form.nombre'),
      required: true,
      width: 12,
    },
    {
      name: 'tiempoEstimadoMinutos',
      label: t('recipes.form.tiempoPreparacion'),
      type: 'number',
      required: true,
      width: 6,
    },
    {
      name: 'dificultad',
      label: t('recipes.form.dificultad'),
      type: 'select',
      required: true,
      width: 6,
      options: [
        {
          value: DificultadReceta.FACIL,
          label: t('recipes.form.dificultadFacil'),
        },
        {
          value: DificultadReceta.MEDIA,
          label: t('recipes.form.dificultadMedia'),
        },
        {
          value: DificultadReceta.DIFICIL,
          label: t('recipes.form.dificultadDificil'),
        },
      ],
    },
    {
      name: 'instrucciones',
      label: t('recipes.form.instrucciones'),
      type: 'textarea',
      required: true,
      width: 12,
    },
    {
      name: 'rendimiento',
      label: t('recipes.form.rendimiento'),
      type: 'number',
      width: 6,
    },
    {
      name: 'unidadResultado',
      label: t('recipes.form.unidadResultado'),
      type: 'select',
      width: 6,
      options: Object.values(UnidadIngrediente).map((unidad) => ({
        value: unidad as string,
        label: unidad as string,
      })),
    },
    {
      name: 'diasCaducidad',
      label: t('recipes.form.diasCaducidad'),
      type: 'number',
      width: 3,
    },
    {
      name: 'costeUnitarioEstimado',
      label: t('recipes.form.costeUnitarioEstimado'),
      type: 'number',
      width: 3,
      disabled: true,
    },
    {
      name: 'raciones',
      label: t('recipes.form.raciones'),
      type: 'portion',
      width: 3,
      step: 0.5,
      min: 0.5,
    },
    {
      name: 'tamanioRacion',
      label: t('recipes.form.tamanioRacion'),
      type: 'number',
      width: 3,
    },
    {
      name: 'ingredientes',
      label: t('recipes.form.ingredientes'),
      type: 'recipeIngredients',
      position: 'bottom',
    },
    {
      name: 'imagen',
      label: t('recipes.form.imagen'),
      type: 'image',
      required: false,
      width: 12,
      position: 'left',
    },
  ];

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        title ??
        (isEditing
          ? t('recipes.form.tituloEditar', {
              nombre: initialData.nombre,
            })
          : t('recipes.form.tituloNueva'))
      }
      size="lg"
      fields={recetaFormSchema}
      initialData={initialData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      requireConfirmation={true}
      confirmationMessage={
        isEditing
          ? t('recipes.form.confirmarEdicion')
          : t('recipes.form.confirmarCreacion')
      }
      onValuesChange={handleValuesChange}
      valueUpdates={valueUpdates}
    />
  );
};

export default RecetaFormModal;
