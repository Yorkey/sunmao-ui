import { CloseIcon } from '@chakra-ui/icons';
import { Box, Button, Text, HStack, IconButton, Input, VStack } from '@chakra-ui/react';
import produce from 'immer';
import { fromPairs, toPairs } from 'lodash-es';
import React, { useState, useMemo, useEffect } from 'react';
import { Type } from '@sinclair/typebox';
import { SpecWidget } from '../Widgets/SpecWidget';
import { ExpressionWidget } from '../Widgets/ExpressionWidget';
import { WidgetProps } from '../../types/widget';
import { mergeWidgetOptionsIntoSpec } from '../../utils/widget';
import { ExpressionEditorProps } from './ExpressionEditor';

const IGNORE_SPEC_TYPES = ['array', 'object'];

type RecordEditorProps = Omit<WidgetProps, 'component' | 'spec' | 'level' | 'path'> & {
  component?: WidgetProps['component'];
  spec?: WidgetProps['spec'];
  path?: WidgetProps['path'];
  level?: WidgetProps['level'];
};

export const RecordEditor: React.FC<RecordEditorProps> = props => {
  const { component, value, spec, services, path = [], level = 1, onChange } = props;
  const { minNum = 0, onlySetValue, isShowHeader } = spec?.widgetOptions || {};
  const generateRows = (currentRows: Array<[string, any]> = []) => {
    let newRows = toPairs(value);

    // keep the rows which has no key
    newRows = newRows.concat(currentRows.filter(([key]) => !key));

    return newRows.length < minNum
      ? newRows.concat(new Array(minNum - newRows.length).fill(['', '']))
      : newRows;
  };
  const [rows, setRows] = useState<Array<[string, any]>>(() => {
    return generateRows();
  });
  const expressionOptions = useMemo<{
    compactOptions: ExpressionEditorProps['compactOptions'];
  }>(
    () => ({
      compactOptions: {
        height: '32px',
      },
    }),
    []
  );

  const emitDataChange = (newRows: Array<[string, string]>) => {
    const json = fromPairs(newRows.filter(([key]) => key));
    onChange(json);
  };

  const onAddRow = () => {
    setRows(prev => [...prev, ['', '']]);
  };
  const onRemoveRow = (i: number) => {
    const newRows = produce(rows, draft => {
      draft.splice(i, 1);
    });
    setRows(newRows);
    emitDataChange(newRows);
  };

  useEffect(() => {
    setRows(generateRows(rows));
  }, [value]);

  const rowItems = rows.map(([key, value], i) => {
    const onInputChange = (e: React.ChangeEvent) => {
      const target = e.target as HTMLInputElement;
      const index = target.name === 'key' ? 0 : 1;
      const newRows = produce(rows, draft => {
        draft[i][index] = target.value;
      });
      setRows(newRows);
    };
    const onValueChange = (newValue: any) => {
      const newRows = produce(rows, draft => {
        draft[i][1] = newValue;
      });
      setRows(newRows);
      emitDataChange(newRows);
    };
    const onBlur = () => emitDataChange(rows);
    const valueSpec =
      spec?.properties && key in spec.properties && spec.properties[key];

    return (
      <HStack key={i} spacing="1" display="flex">
        <Input
          flex={1}
          name="key"
          value={key}
          title={key}
          placeholder="key"
          onChange={onInputChange}
          onBlur={onBlur}
          isDisabled={onlySetValue}
        />
        {component ? (
          <HStack flex={2} alignItems="center">
            {valueSpec &&
            typeof valueSpec !== 'boolean' &&
            !IGNORE_SPEC_TYPES.includes(String(valueSpec.type)) ? (
              <SpecWidget
                component={component}
                value={value}
                path={path.concat(key)}
                level={level + 1}
                spec={mergeWidgetOptionsIntoSpec(valueSpec, {
                  isShowAsideExpressionButton: true,
                  expressionOptions,
                })}
                services={services}
                onChange={onValueChange}
              />
            ) : (
              <Box flex={1}>
                <ExpressionWidget
                  component={component}
                  path={path.concat(key)}
                  spec={Type.String({
                    widgetOptions: { compactOptions: expressionOptions.compactOptions },
                  })}
                  services={services}
                  level={level + 1}
                  value={value}
                  onChange={onValueChange}
                />
              </Box>
            )}
          </HStack>
        ) : (
          <Input
            flex={1}
            name="value"
            value={value}
            title={value}
            placeholder="value"
            onChange={onInputChange}
            onBlur={onBlur}
          />
        )}
        {onlySetValue ? null : (
          <IconButton
            aria-label="remove row"
            icon={<CloseIcon />}
            size="xs"
            onClick={() => onRemoveRow(i)}
            variant="ghost"
            isDisabled={minNum >= rows.length}
          />
        )}
      </HStack>
    );
  });

  return (
    <VStack spacing="2" alignItems="stretch">
      {isShowHeader !== false ? (
        <HStack spacing="1" display="flex" marginRight="28px">
          <Text flex={1}>Key</Text>
          <Text flex={1}>Value</Text>
        </HStack>
      ) : null}
      {rowItems}
      {onlySetValue ? null : (
        <Button onClick={onAddRow} size="xs" alignSelf="start">
          + Add
        </Button>
      )}
    </VStack>
  );
};