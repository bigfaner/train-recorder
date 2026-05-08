import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { Colors, ComponentSizes } from "@utils/constants";

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "number-pad" | "decimal-pad";
  style?: object;
  editable?: boolean;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  style,
  editable = true,
}: InputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      keyboardType={keyboardType}
      editable={editable}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: ComponentSizes.inputBorderRadius,
    paddingHorizontal: ComponentSizes.inputPaddingHorizontal,
    fontSize: 17,
    color: Colors.textPrimary,
    borderWidth: 0,
  },
});
