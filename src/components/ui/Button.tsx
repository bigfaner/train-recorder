import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Colors, ComponentSizes } from "@utils/constants";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const variantStyles: Record<
  ButtonVariant,
  { wrapper: ViewStyle; text: TextStyle }
> = {
  primary: {
    wrapper: {
      backgroundColor: Colors.accent,
    },
    text: {
      color: "#ffffff",
    },
  },
  secondary: {
    wrapper: {
      backgroundColor: "transparent",
    },
    text: {
      color: Colors.accent,
    },
  },
  destructive: {
    wrapper: {
      backgroundColor: Colors.error,
    },
    text: {
      color: "#ffffff",
    },
  },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={[
        styles.wrapper,
        variantStyle.wrapper,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          styles.text,
          variantStyle.text,
          disabled && styles.disabledText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: ComponentSizes.buttonHeight,
    borderRadius: ComponentSizes.buttonBorderRadius,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    // Additional disabled text styles if needed
  },
});
