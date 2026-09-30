import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

interface MarkdownTextProps {
  content: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  isUser?: boolean;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({
  content,
  style,
  containerStyle,
  isUser = false,
}) => {
  if (!content) return null;

  // Split content by lines
  const lines = content.split('\n');

  return (
    <View style={[styles.container, containerStyle]}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line -> paragraph spacing
        if (!trimmed) {
          return <View key={lineIdx} style={styles.paragraphSpacer} />;
        }

        // Header ###
        if (trimmed.startsWith('### ')) {
          const headerText = trimmed.replace(/^###\s+/, '');
          return (
            <Text
              key={lineIdx}
              style={[
                styles.h3,
                isUser && styles.userText,
                style,
              ]}
            >
              {renderFormattedInline(headerText, isUser)}
            </Text>
          );
        }

        // Header ##
        if (trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^##\s+/, '');
          return (
            <Text
              key={lineIdx}
              style={[
                styles.h2,
                isUser && styles.userText,
                style,
              ]}
            >
              {renderFormattedInline(headerText, isUser)}
            </Text>
          );
        }

        // Bullet item (- or *)
        if (/^[-*]\s+/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <View key={lineIdx} style={styles.bulletRow}>
              <View style={[styles.bulletDot, isUser && styles.userBulletDot]} />
              <Text
                style={[
                  styles.bulletText,
                  isUser && styles.userText,
                  style,
                ]}
              >
                {renderFormattedInline(bulletText, isUser)}
              </Text>
            </View>
          );
        }

        // Numbered item (1. 2. etc)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const numText = numMatch[2];
          return (
            <View key={lineIdx} style={styles.bulletRow}>
              <Text style={[styles.numIndex, isUser && styles.userText]}>{num}.</Text>
              <Text
                style={[
                  styles.bulletText,
                  isUser && styles.userText,
                  style,
                ]}
              >
                {renderFormattedInline(numText, isUser)}
              </Text>
            </View>
          );
        }

        // Normal paragraph line
        return (
          <Text
            key={lineIdx}
            style={[
              styles.paragraph,
              isUser && styles.userText,
              style,
            ]}
          >
            {renderFormattedInline(line, isUser)}
          </Text>
        );
      })}
    </View>
  );
};

/**
 * Parses bold (**text** or *text*), inline code (`code`), and plain text without rendering asterisks.
 */
function renderFormattedInline(text: string, isUser: boolean): React.ReactNode[] {
  // Regex pattern matching:
  // 1. `code`
  // 2. **bold**
  // 3. *italic/bold*
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`plain-${keyIndex++}`} style={isUser ? styles.userText : styles.normalText}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }

    const chunk = match[0];

    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      // Inline code
      const code = chunk.slice(1, -1);
      parts.push(
        <View key={`code-${keyIndex++}`} style={[styles.codeBadge, isUser && styles.userCodeBadge]}>
          <Text style={[styles.codeText, isUser && styles.userCodeText]}>{code}</Text>
        </View>
      );
    } else if (chunk.startsWith('**') && chunk.endsWith('**')) {
      // Bold
      const boldText = chunk.slice(2, -2);
      parts.push(
        <Text
          key={`bold-${keyIndex++}`}
          style={[styles.boldText, isUser && styles.userBoldText]}
        >
          {boldText}
        </Text>
      );
    } else if (chunk.startsWith('*') && chunk.endsWith('*')) {
      // Italic / emphasis
      const emText = chunk.slice(1, -1);
      parts.push(
        <Text
          key={`em-${keyIndex++}`}
          style={[styles.boldText, isUser && styles.userBoldText]}
        >
          {emText}
        </Text>
      );
    }

    lastIndex = match.index + chunk.length;
  }

  // Add trailing plain text
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`plain-${keyIndex++}`} style={isUser ? styles.userText : styles.normalText}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return parts;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraphSpacer: {
    height: 6,
  },
  paragraph: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
    marginBottom: 3,
    fontFamily: 'Manrope_400Regular',
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#059669',
    marginTop: 5,
    marginBottom: 3,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: -0.2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
    marginTop: 8,
    marginRight: 8,
  },
  userBulletDot: {
    backgroundColor: '#FFFFFF',
  },
  numIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginRight: 6,
    fontFamily: 'Manrope_700Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    fontFamily: 'Manrope_400Regular',
  },
  normalText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
    fontFamily: 'Manrope_400Regular',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Manrope_700Bold',
  },
  userText: {
    color: '#FFFFFF',
  },
  userBoldText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  userCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0F172A',
  },
  userCodeText: {
    color: '#FFFFFF',
  },
});
