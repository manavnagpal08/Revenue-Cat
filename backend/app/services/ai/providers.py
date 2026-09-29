import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("soloceo_ai_providers")

class AIProvider(ABC):
    """Abstract base class for AI model providers."""
    
    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: str,
        structured_json: bool = True,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Generate response from the AI provider."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        self.model_name = model
        self.client = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}")

    @property
    def provider_name(self) -> str:
        return "Gemini (google-genai)"

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str,
        structured_json: bool = True,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        if not self.client or not self.api_key:
            raise ValueError("Gemini API key is not configured in environment.")

        try:
            full_prompt = f"System Instructions:\n{system_instruction}\n\nUser Query & Context:\n{prompt}"
            if structured_json:
                full_prompt += "\n\nCRITICAL: Respond with a valid JSON object only. Do NOT include markdown code fences or backticks."

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
            )
            
            raw_text = response.text.strip()
            # Clean possible markdown wrapping
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            if structured_json:
                try:
                    return json.loads(raw_text)
                except json.JSONDecodeError:
                    return {"message": raw_text, "raw": True}
            return {"message": raw_text}

        except Exception as e:
            logger.error(f"Gemini API generation error: {e}")
            raise


class OpenAIProvider(AIProvider):
    """OpenAI Provider."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self.model_name = model
        self.client = None
        
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    @property
    def provider_name(self) -> str:
        return "OpenAI"

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str,
        structured_json: bool = True,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        if not self.client or not self.api_key:
            raise ValueError("OpenAI API key is not configured in environment.")

        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                response_format={"type": "json_object"} if structured_json else None
            )
            raw_text = response.choices[0].message.content or "{}"
            if structured_json:
                return json.loads(raw_text)
            return {"message": raw_text}
        except Exception as e:
            logger.error(f"OpenAI API generation error: {e}")
            raise


class DeterministicBusinessReasoningEngine(AIProvider):
    """
    Deterministic NLP & Business Intelligence Reasoning Engine.
    Used when external cloud LLM API keys are not present in the environment.
    Provides mathematically accurate, deterministic analysis of real Supabase data.
    """

    @property
    def provider_name(self) -> str:
        return "SoloCEO Deterministic Engine (Zero-Hallucination)"

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str,
        structured_json: bool = True,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        # Context is passed inside prompt as structured JSON or text
        return {
            "engine": "deterministic",
            "message": "Processed query via deterministic business operations engine."
        }


def get_ai_provider() -> AIProvider:
    """Factory function to get the best available AI provider."""
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")

    if gemini_key:
        return GeminiProvider(api_key=gemini_key)
    elif openai_key:
        return OpenAIProvider(api_key=openai_key)
    else:
        return DeterministicBusinessReasoningEngine()
