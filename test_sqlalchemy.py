from sqlalchemy import create_engine

# Asegúrate de que la cadena de conexión está correcta y utiliza el prefijo 'postgresql://'
database_url = "postgresql://postgres:1234@localhost:5432/PyPSAEarthDashboard"

try:
    # Intenta crear un motor de base de datos usando la URL de la base de datos
    engine = create_engine(database_url, echo=True)
    # Conectar al motor para probar la conexión
    connection = engine.connect()
    print("Conexión exitosa.")
    connection.close()
except Exception as e:
    print("Error al conectar a la base de datos:", str(e))

