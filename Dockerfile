FROM condaforge/mambaforge

RUN conda update -n base conda
RUN conda install -n base conda-libmamba-solver
RUN conda config --set solver libmamba

ENV APP_HOME=/app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR $APP_HOME

COPY ./environment.yml $APP_HOME

RUN conda env create -f environment.yml

RUN echo "source activate dashboard_env" > ~/.bashrc
ENV PATH /opt/conda/envs/dashboard_env/bin:$PATH

COPY . $APP_HOME

RUN python manage.py makemigrations
RUN python manage.py migrate
RUN python manage.py collectstatic --noinput --clear

# ENTRYPOINT [ "python","manage.py","runserver", "0.0.0.0:8000" ]
ENTRYPOINT [ "gunicorn","PyPSAEarthDashboard.wsgi:application","--bind","0.0.0.0:8000" ]  