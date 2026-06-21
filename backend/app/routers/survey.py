from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.onboarding import OnboardingSurvey
from app.models.user import User
from app.schemas.survey import SurveyReadResponse, SurveySubmitRequest

router = APIRouter(prefix="/survey", tags=["survey"])


@router.get("/status")
def get_survey_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, bool]:
    survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == current_user.id))
    return {"has_survey": survey is not None}


@router.post("/submit", response_model=SurveyReadResponse, status_code=status.HTTP_201_CREATED)
def submit_survey(
    payload: SurveySubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingSurvey:
    survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == current_user.id))
    if not survey:
        survey = OnboardingSurvey(user_id=current_user.id)
        db.add(survey)

    survey.current_year = payload.current_year
    survey.dsa_experience_level = payload.dsa_experience_level
    survey.target_companies = payload.target_companies
    survey.weekly_study_hours = payload.weekly_study_hours
    survey.preferred_language = payload.preferred_language
    survey.preparation_start_date = payload.preparation_start_date
    survey.goal_timeline_months = payload.goal_timeline_months
    survey.weak_areas = payload.weak_areas
    survey.confidence_level = payload.confidence_level

    db.commit()
    db.refresh(survey)
    return survey


@router.get("", response_model=SurveyReadResponse)
def get_survey(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingSurvey:
    survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == current_user.id))
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found")
    return survey
